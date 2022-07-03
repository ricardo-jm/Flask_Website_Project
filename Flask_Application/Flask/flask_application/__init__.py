"""
This init file is opened by MTB_API, it creates the Flask flask_application and sets configuration settings for the app and database connection.
It also sets up the imports for files required by the flask_application.

Creates flask_application object as an instance of class Flask, given the name of the module which called it,
in this case it will be "flask_application"

The flask_application package is defined by the flask_application directory and this init file.

See:
https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world

@Author: Gavin Leavitt

"""
from flask import Flask
from flask_cors import CORS
import os
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import utc
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlathanor import FlaskBaseModel, initialize_flask_sqlathanor
from flask_sqlalchemy import SQLAlchemy
from pygeoapi.flask_app import BLUEPRINT as pygeoapi_blueprint

# Create flask flask_application, I believe "flask_application" has to be used to work properly on AWS EB
application = app = Flask(__name__, subdomain_matching=True)
# cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
cors = CORS(app, origins=["https://leavittmapping.com","http://leavitttesting.local:5000",
                          "http://geo.leavitttesting.local:5000"])
# Setup CORS
# CORS(app)

# Setup logger
logger = logging.getLogger(__name__)
# Set time and message format of logs
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
# Set Logger to debug level
logger.setLevel(logging.DEBUG)
# Set logging pathway depending on if Flask is running local or on AWS EB on Amazon Linux 2
application.logger.debug(f"Flask is running in {application.config['ENV']} mode")
# if "B:\\" in os.getcwd():

# Set logging and SQL DB connection settings based on if in production or development mocde
if application.config['ENV'] == "development":
    # Localhost development testing
    # TODO: Test
    app.config['SERVER_NAME'] = "leavitttesting.local:5000"
    application.logger.debug('Development mode')
    dirname = os.path.dirname(__file__)
    # handler = RotatingFileHandler(os.path.join(dirname, '../logs/flask_application.log'), maxBytes=1024, backupCount=5)
    handler = logging.FileHandler(os.path.join(dirname, '../logs/flask_application.log'))
    # app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DBCON_LOCAL")
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DBCON_DEV")
    # Setup SQLAlachemy engine sessionmaker factories with development connections
    lacotraceEng = create_engine(os.environ.get("DBCON_LACOTRACE_DEV"))
    engine = create_engine(os.environ.get("DBCON_DEV"))
    stravaViewerEng = create_engine(os.environ.get("DBCON_STRAVAVIEWER_DEV"))
    gpsTrackEng = create_engine(os.environ.get("DBCON_GPSTRACKING_DEV"))
    waterQualityEng = create_engine(os.environ.get("DBCON_WATERQUALITY_DEV"))

    # localurl = "leavitttesting.com:5000"
    # flask_application.logger.debug(f"Setting up local development server name: {localurl}")
    # app.config['SERVER_NAME'] = localurl
else:
    # Live deployment
    # see https://stackoverflow.com/a/60549321
    # handler = RotatingFileHandler('/tmp/flask_application.log', maxBytes=1024, backupCount=5)
    application.logger.debug('Production mode')
    # TODO: Test
    app.config['SERVER_NAME'] = "leavittmapping.com"
    handler = logging.FileHandler('/tmp/flask_application.log')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DBCON_PROD")
    application.logger.debug(f"Setting up in Production mode with the server name: {app.config['SERVER_NAME']}")
    lacotraceEng = create_engine(os.environ.get("DBCON_LACOTRACE_PROD"))
    engine = create_engine(os.environ.get("DBCON_PROD"))
    stravaViewerEng = create_engine(os.environ.get("DBCON_STRAVAVIEWER_PROD"))
    gpsTrackEng = create_engine(os.environ.get("DBCON_GPSTRACKING_PROD"))
    waterQualityEng = create_engine(os.environ.get("DBCON_WATERQUALITY_PROD"))

#  Bind sessionmakers
lacotraceSes = sessionmaker(bind=lacotraceEng)
stravaViewerSes = sessionmaker(bind=stravaViewerEng)
Session = sessionmaker(bind=engine)
gpsTrackSes = sessionmaker(bind=gpsTrackEng)
waterQualitySes = sessionmaker(bind=waterQualityEng)
# Set logging handler
handler.setFormatter(formatter)



# Disabling modification tracking
application.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# Init flask sqlalchemy database with flask
db = SQLAlchemy(application, model_class = FlaskBaseModel)
# db.init_app(app)
# Setup SQLAthanor
db = initialize_flask_sqlathanor(db)

# Setup SQLAlchemy engine sessionmaker factory for localhost
# engineLocal = create_engine(os.environ.get("DBCON_LOCAL"))
# SessionLocal = sessionmaker(bind=engineLocal)

# Attach logging handler to flask_application
application.logger.addHandler(handler)
application.logger.debug("Python Flask debugger active!")

# Import HTTP auth
from flask_application.util.flaskAuth.authentication import auth
# Import error email reporting
from .util.ErrorEmail import errorEmail
# Import shared assets
# from .util import assets
# Import Blueprints
from .mainPages.mainRoutes import mainSite_BP
from .projectPages.projectPageRoutes import projectPages_BP
from .WebAppProjects.LocationLiveTracker.routes import liveTracker_BP
from .WebAppProjects.LocationLiveTracker.API_Routes import livetrackerAPI_BP
from .WebAppProjects.StravaActivityViewer.API_Routes import stravaActDashAPI_BP
from .WebAppProjects.StravaActivityViewer.routes import stravaActDash_BP
from .WebAppProjects.StravaActivityViewer.API_Admin_Routes import stravaActDashAPI_Admin_BP
from .WebAppProjects.WaterQualityViewer.routes import sbcWaterQuality_BP
from .WebAppProjects.WaterQualityViewer.API_Routes import sbcWaterQualityAPI_BP
from .WebAppProjects.LACO_SW_TraceApp.routes import lacoSWTraceapp_BP
from .WebAppProjects.LACO_SW_TraceApp.API_Routes import lacoSWTraceapp_API_BP
from .WebAppProjects.OrthomosaicViewer.routes import orthoviewer_BP
# Register blueprints with flask_application
app.register_blueprint(mainSite_BP)
app.register_blueprint(projectPages_BP)
app.register_blueprint(liveTracker_BP, url_prefix='/webapps/tracker')
app.register_blueprint(livetrackerAPI_BP, url_prefix='/api/v1/tracker')
app.register_blueprint(stravaActDashAPI_BP, url_prefix='/api/v1/activitydashboard')
app.register_blueprint(stravaActDash_BP, url_prefix='/webapps/stravapp')
app.register_blueprint(sbcWaterQuality_BP, url_prefix='/webapps/sbcwaterquality')
app.register_blueprint(lacoSWTraceapp_BP, url_prefix='/webapps/lacoswtrace')
app.register_blueprint(sbcWaterQualityAPI_BP, url_prefix='/api/v1/sbcwaterquality')
app.register_blueprint(stravaActDashAPI_Admin_BP, url_prefix='/admin/api/v1/activitydashboard')
app.register_blueprint(orthoviewer_BP, url_prefix='/webapps/orthoviewer')

# Register PyGeoAPI
# app.register_blueprint(pygeoapi_blueprint, url_prefix='/pygeo')
app.register_blueprint(pygeoapi_blueprint, subdomain='geo')
# app.register_blueprint(lacoSWTraceapp_API_BP, url_prefix='/api/v1/trace')
application.register_blueprint(lacoSWTraceapp_API_BP, url_prefix='/api/v1/trace')
# # Set up celery client, allows async tasks to be setup
# app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
# # app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
# cel_client = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
# cel_client.conf.update(app.config)

# Import project files (initialize them?), imports from the flask_application flask object have to be after flask
# flask_application is initialized to avoid circular imports
# from flask_application import routes, routes_api, models_tracker, parsePDF_WaterQual, StravaWebHook, TestingandDevelopmentRoutes
# from flask_application import routes, routes_api
# from flask_application.development import testingAndDevelopmentRoutes
# from flask_application.WebAppProjects import location_tracker, strava_activities, water_quality
from flask_application.WebAppProjects.WaterQualityViewer import functionsWaterQual
# from flask_application.WebAppProjects.strava_activities import DBQueriesStrava, StravaAWSS3

# Setup APS scheduler instance
sched = BackgroundScheduler(daemon=True, timezone=utc)
# Set logging for APS scheduler
logging.getLogger('apscheduler').setLevel(logging.DEBUG)
# Setup scheduled tasks
if application.config['ENV'] != "development":
    try:
        # Trigger every day at 9:30 am
        # sched.add_job(parsePDF.pdfjob, trigger='cron', hour='9', minute='30')
        # sched.add_job(parsePDF.pdfjob, trigger='cron', hour='15', minute='37')
        # Add PDF parsing job to trigger daily at 4:30 pm UTC, 9:30 PST
        sched.add_job(functionsWaterQual.pdfjob, trigger='cron', hour='16', minute='30')
        # Trigger every minute
        # sched.add_job(parsePDF.pdfjob, 'cron', minute='*')
        # Start scheduled jobs
        sched.start()
        application.logger.debug("Scheduled task created")
    except Exception as e:
        application.logger.error("Failed to create parse pdfjob")
        application.logger.error(e)

    # Shutdown cron thread if the web process is stopped
    atexit.register(lambda: sched.shutdown(wait=False))
