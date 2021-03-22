import os
from application import application, errorEmail
from application.WebAppProjects.StravaActivityViewer import OAuthStrava, DBQueriesStrava, APIFunctionsStrava, StravaAWSS3
import json
from threading import Thread

def threadedActivityProcessing(client, update):
    """

    @param client:
    @param update:
    @return:
    """

    try:
        application.logger.debug("Getting full activity details")
        # Get all activity details for newly created activity, including stream data
        activity = APIFunctionsStrava.getFullDetails(client, update.object_id)
        application.logger.debug("Inserting activity details")
        # Insert original, non-masked, coordinates and attribute details into Postgres/PostGIS
        DBQueriesStrava.insertOriginalAct(activity['act'])
        # Calculate masked, publicly sharable, activities and insert into Postgres masked table
        application.logger.debug("Processing and inserting masked geometries")
        DBQueriesStrava.processActivitiesPublic(activity["act"]["actId"])
        # Create in-memory buffer csv of stream data
        csvBuff = StravaAWSS3.writeMemoryCSV(activity["stream"])
        # Get WKT formatted latlng stream data
        wktStr = APIFunctionsStrava.formatStreamData(csvBuff)
        # Get list of coordinates which cross privacy areas, these will be removed from the latlng stream CSV data
        removeCoordList = DBQueriesStrava.getIntersectingPoints(wktStr)
        # Trim/remove rows from latlng CSV stream which have coordinates that intersect the privacy areas
        trimmedMemCSV = APIFunctionsStrava.trimStreamCSV(removeCoordList, csvBuff)
        # Upload trimmed buffer csv to AWS S3 bucket
        StravaAWSS3.uploadToS3(trimmedMemCSV, activity["act"]["actId"])
        # Create topojson file
        topoJSON = DBQueriesStrava.createStravaPublicActTopoJSON()
        # Upload topoJSON to AWS S3
        StravaAWSS3.uploadToS3(topoJSON)
        # Send success email
        errorEmail.sendSuccessEmail("Webhook Activity Update", f'The strava activity: {activity["act"]["actId"]}'
                                                               f' has been processed, the activity can be'
                                                               f' viewed on Strava at: '
                                                               f'https://www.strava.com/activities/{activity["act"]["actId"]}')
        application.logger.debug("Strava activity has been processed!")
    except Exception as e:
        application.logger.error(f"Handling and inserting new webhook activity inside a thread failed with the error {e}")
        errorEmail.sendErrorEmail(script="Webhook Activity Threaded Task Update", exceptiontype=e.__class__.__name__, body=e)


def handleSubUpdate(client, updateContent):
    """
    Handles Strava webhook subscription update. This function is called by a valid Strava POST request to the webhook
    subscription callback URL.

    Parameters
    ----------
    client. Stravalib model client object. Contains access token to strava API for the user.
    updateContent. Dict. POST request JSON data formatted by Flask as a dict.

    Returns
    -------
    Nothing. Data are inserted into Postgres/PostGIS.
    """

    # Parse update information into a model using stravalib
    update = client.handle_subscription_update(updateContent)
    # Verify that the athlete(s) and subscription ID contained in the message are in Postgres
    if update.owner_id in DBQueriesStrava.getAthleteList() and update.subscription_id in \
            DBQueriesStrava.getSubIdList():
        application.logger.debug("Sub update from Strava appears valid")
        # Insert subscription update message details into Postgres
        DBQueriesStrava.insertSubUpdate(update)
        # Verify that the update is a activity creation event
        if update.aspect_type == "create" and update.object_type == "activity":
            application.logger.debug("This is a activity create event, creating thread to process activity")
            try:
                Thread(target=threadedActivityProcessing, args=(client, update)).start()
            except Exception as e:
                application.logger.error(f"Creating a thread to process new activity failed with in the error: {e}")
                errorEmail.sendErrorEmail(script="Webhook Activity Threading", exceptiontype=e.__class__.__name__, body=e)
        elif update.aspect_type == "update" and update.object_type == "activity":
            application.logger.debug("This is a activity update event, updating existing record")
            DBQueriesStrava.updateExistingActivity(update)
        else:
            # Write logic to handle update and delete events
            application.logger.debug("Sub update message contains an update or delete event, skipping request")
            pass
    else:
        application.logger.debug("POST request is invalid, user ID or subscription ID don't match those in database!")


# def handleSubCallback(request):
def handleSubCallback(request):
    """
    Handles requests to Strava subscription callback URL.

    GET:
        Webhoook Subscription Creation Process:
            CallbackURL is sent a GET request containing a challenge code. This code is sent back to requester to verify
            the callback.

             The initial request to create a new webhook subscription, called by visiting URL containing
             handle_Create_Strava_Sub(), is then provided with verification creation and the new subscription ID.
    POST:
        Webhook subscription update message. Sent when a activity on a subscribed account is created, updated, or deleted,
        or when a privacy related profile setting is changed.

        All update messages are inputted into Postgres.

        Currently, only activity creation events are handled, additional development is needed to handle other events.

    Returns
    -------
    GET request:
        JSON, echoed Strava challenge text.
    POST request:
        Success code if data are successfully added to Postgres/PostGIS. Strava must receive a 200 code in response to
        POST.
    """
    # application.logger.debug("Waiting!")
    # time.sleep(10)
    # application.logger.debug("Got a callback request!")
    # Get application access credentials
    client = OAuthStrava.getAuth()
    # Check if request is a GET callback request, part of webhook subscription process
    if request.method == 'GET':
        application.logger.debug("Got a GET callback request from Strava to verify webhook!")
        # Extract challenge and verification tokens
        callBackContent = request.args.get("hub.challenge")
        callBackVerifyToken = request.args.get("hub.verify_token")
        # Form callback response as dict
        callBackResponse = {"hub.challenge": callBackContent}
        # Check if verification tokens match, i.e. if GET request is from Strava
        if callBackVerifyToken == os.getenv('STRAVA_VERIFY_TOKEN'):
            application.logger.debug(f"Strava callback verification succeeded, responding with the challenge code"
                                     f" message {callBackResponse}")
            # Verification succeeded, return challenge code as dict
            # Using Flask Response API automatically converts it to JSON with HTTP 200 success code
            return callBackResponse
        else:
            # Verification failed, raise error
            application.logger.error(f"Strava verification token doesn't match!")
            raise ValueError('Strava token verification failed.')
    # POST request containing webhook subscription update message, new activity or other change to Strava account
    elif request.method == 'POST':
        application.logger.debug("New activity incoming! Got a POST callback request from Strava")
        try:
            ## TODO:
            # Fix, I think the request isn't coming through properly
            # see https://stackoverflow.com/questions/46092457/flask-request-get-json-raise-badrequest
            # callbackContent = request.get_json()
            # Convert JSON body to dict
            callbackContent = json.loads(request.data, strict=False)
            application.logger.debug("JSON content has been extracted")
            application.logger.debug(f"Update content is {callbackContent}")
            # application.logger.debug(f"Update content dir is {dir(callbackContent)}")
            # Call function to handle update message and process new activity, if applicable
            handleSubUpdate(client, callbackContent)
            application.logger.debug("Inserted webhook update and activity details into postgres tables!")
            # return success code, Strava expects this code
            # return 200
        except Exception as e:
            application.logger.error(f"Strava subscription update failed with the error {e}")
            # return 500