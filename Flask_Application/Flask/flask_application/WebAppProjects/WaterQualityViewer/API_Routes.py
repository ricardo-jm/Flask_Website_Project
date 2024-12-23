from flask_application.WebAppProjects.WaterQualityViewer import functionsWaterQual, DBQueriesWaterQuality
from flask import render_template, Blueprint, request
from werkzeug.utils import escape  # Import escape function

sbcWaterQualityAPI_BP = Blueprint('sbcWaterQualityAPI_BP', __name__,
                        template_folder='templates',
                        static_folder='static')


@sbcWaterQualityAPI_BP.route("getbeachhistory", methods=['GET'])
def getWaterQualityHistory():
    beachName = escape(str(request.args.get("beachName")))
    return DBQueriesWaterQuality.getBeachResults(beachName)
