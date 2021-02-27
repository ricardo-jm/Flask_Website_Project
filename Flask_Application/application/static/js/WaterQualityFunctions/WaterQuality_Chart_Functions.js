function createChart(beachName){
  // console.log("Clicked history button!")
  // Query API for records
  getBeachHistory(beachName).then(function(beachHistory){
    // console.log("Creating beach history chart")

    // Set chart display div to display block
    var historyChartContent = document.getElementById('hist-Tab');
    historyChartContent.style.display = "block";
    var historyChartDiv = document.getElementById('history-chart').getContext('2d');
    // Destroy chart if already existing
    if(window.historyChart instanceof Chart)
      {
        // console.log("Destroying exsiting chart!")
        window.historyChart.destroy();
      }
    resizePopupforChart()
    var parsedData = parseBeachData(beachHistory);
    // https://stackoverflow.com/questions/43090102/chartjs-mapping-non-numeric-y-and-x
    // console.log("Creating new chart!")
    historyChart = new Chart(historyChartDiv, {
      type: 'line',
      data:{
        yLabels: ["Open","Warning","Closed"],
        xLabels: parsedData["dataX"],
        datasets:[{
          data:parsedData["dataY"],
          showLine: false,
          label: "Status"
        }]
      },
      options: {
        onClick: function(event, activeElements){
          if (activeElements.length > 0){
            var index = activeElements[0]._index
            // console.log(index)
            // console.log(parsedData)
            // console.log(parsedData.pdfLink[index])
            // console.log(parsedData.dataX[pdfLink])
            openDownloadModal(parsedData.dataX[index],parsedData.pdfLink[index]);
          }
        },
        layout:{
          padding:{
            right: 15
          }
        },
        title: {
          display: true,
          text: [beachName,"(Click Point to Download Report)"],
          padding: 15,
          fontSize: 15
        },
        legend: {
          display: false
        },
        responsive: true,
        scales: {
          xAxes: [{
            ticks:{
              fontStyle: 'bold',
              padding: 10
            }
          }],
          yAxes:[{
            type:'category',
            position: "left",
            ticks:{
              labels: ["Open","Warning", "Closed"],
              padding: 10,
              fontStyle: 'bold'
            }
          }]
        },
        elements:{
          point:{
            radius: 10,
            hoverRadius: 15,
            pointStyle: function(context){
              var index = context.dataIndex;
              var value = context.dataset.data[index];
              if (value == "Open"){
                return 'circle'
              }
              else if (value == 'Warning'){
                return "triangle"
              } else if (value == 'Closed'){
                return 'cross'
              }
            },
            backgroundColor: function(context){
              var index = context.dataIndex;
              var value = context.dataset.data[index];
              if (value == "Open"){
                return 'rgba(81, 75, 191)'
              }
              else if (value == 'Warning'){
                return 'rgba(255, 215, 100)'
              } else if (value == 'Closed'){
                return 'rgba(244, 67, 54)'
              }
            }
          }
        }
      },
    })
  })
};

function getBeachHistory(beachName){
  beachHistoryURL = '/api/v0.1/getbeachhistory'
  return $.ajax({
      url:beachHistoryURL,
      //https://stackoverflow.com/questions/47523265/jquery-ajax-no-access-control-allow-origin-header-is-present-on-the-requested
      data: {beachName:beachName},
      type: 'GET',
      dataType: 'json'
  });
};

function parseBeachData(beachHistory){
  dataY = []
  dataX = []
  pdfLink = []
  // pdfDate = []
  // console.log(beachHistory)
  for (i of Object.keys(beachHistory)){
    // console.log(beachHistory[i])
    // dataY.push(moment(beachHistory[i].date, 'DD-MM-YY').toDate());
    dataX.push(moment(beachHistory[i].date, 'YYYY-MM-DD').format("MMM-DD-YY"));
    dataY.push(beachHistory[i].status)
    pdfLink.push(beachHistory[i].s3PDFURL)
    // pdfDate.push(moment(beachHistory[i].date, 'YYYY-MM-DD').format("MMM-DD-YY"))
  }
  // console.log("Data X:")
  // console.log(dataX)
  // console.log("Data Y:")
  // console.log(dataY)
  return {"dataX":dataX, "dataY":dataY, "pdfLink":pdfLink}
};

function resizePopupforChart(){

  // beachreports.eachLayer(function(layer){
  //   // console.log(layer.getPopup())
  //   latlng = layer.getLatLng()
  //   console.log(latlng)
  //   layer.getPopup().setLatLng(latlng)
  // })
  var popupContent = document.getElementsByClassName('leaflet-popup-content-wrapper')
  var historyContent = document.getElementById('hist-content')
  popupContent[0].style.width = "500px";
  historyContent.style.width = "400px";
  popupContent[0].style.height = "300px";
  historyContent.style.height = "200px";
  var contextArrow = document.getElementsByClassName('leaflet-popup-tip-container')[0]
  contextArrow.style.marginLeft = "-101px";
  var textContent = document.getElementById('text-content');
  textContent.style.display = "none";
  // see: https://leafletjs.com/reference-1.7.1.html#popup-update
  // https://gis.stackexchange.com/a/244961
  // Update popup to recalculate its size


}

function openDownloadModal(pdfDate, downloadURL){

  console.log(pdfDate)
  // Modal from https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal
  // Get the modal
  var modal = document.getElementById("downloadPDF-modal");

  // Set text

  // Open modal
  modal.style.display = "block";
  // Get the button that opens the modal

  // var btn = document.getElementById("btn");

  // Get the <span> element that closes the modal
  var spanClose = document.getElementById("downloadModalClose");
  // Set text for downloadURL
  var link = document.getElementById("pdfDownloadLink");
  link.setAttribute("href", downloadURL);
  // Set text for pdf date
  document.getElementById("downloadPDF").innerHTML = pdfDate

  // When the user clicks the button, open the modal
  // btn.onclick = function() {
  //   modal.style.display = "block";
  // }

  // When the user clicks on <span> (x), close the modal
  spanClose.onclick = function() {
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
};
