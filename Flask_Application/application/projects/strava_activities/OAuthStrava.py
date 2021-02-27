from application.stravalib.client import Client
import os
import time
from application import app, Session
from application.projects.strava_activities.modelsStrava import athletes

def getAuth():
    """
    Loads Strava client object from Postgres. Checks if access token is expired, if so it is refreshed and updated.

    Returns
    -------
    client. Stravalib model client object. Contains access token to strava API for the user.
    """
    # Build empty stravalib client instance
    client = Client()
    # create db session
    session = Session()
    # Hard coded athlete id
    athleteID = 7170058
    authDict = {}
    # Load tokens and expiration time from Postgres
    query = session.query(athletes).filter(athletes.athlete_id == athleteID)
    for i in query:
        authDict["Access_Token"] = i.access_token
        authDict["Expiration"] = i.access_token_exp
        authDict["Refresh_Token"] = i.refresh_token
    # Check if access token has expired, if so request a new one and update Postgres
    if time.time() > authDict["Expiration"]:
        refresh_response = client.refresh_access_token(client_id=int(os.environ.get('STRAVA_CLIENT_ID')),
                                                       client_secret=os.environ.get('STRAVA_CLIENT_SECRET'),
                                                       refresh_token=authDict["Refresh_Token"])
        # Update access token and expiration date
        session.query(athletes).filter(athletes.athlete_id == athleteID). \
            update({athletes.access_token: refresh_response['access_token'],
                    athletes.access_token_exp: refresh_response['expires_at']})
        # Commit update
        session.commit()
        # Set Strava auth details
        client.access_token = refresh_response['access_token']
        client.refresh_token = authDict["Refresh_Token"]
        client.token_expires_at = refresh_response['expires_at']
    else:
        # Access token is up-to-date, set client details
        client.access_token = authDict["Access_Token"]
        client.refresh_token = authDict["Refresh_Token"]
        client.token_expires_at = authDict["Expiration"]
    # Close out session
    session.close()
    return client
