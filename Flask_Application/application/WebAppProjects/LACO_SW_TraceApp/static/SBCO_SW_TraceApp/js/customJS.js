/*jshint esversion: 6 */
var btnActive = "inactive";
var userLat = null;
var userlon = null;
var serverResponse = null;
var map = null;
var view = null;
var blockBtn = "inactive"
var blockList = []
var gravMainsTileURL = "https://vectortileservices3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/gravity_mains_vector_tile_layer/VectorTileServer/tile/{z}/{y}/{x}.pbf"
var activeLayerIDs = []
// var layerObj = null;
// var selectionLayer = null
// var resultslayer = null
require(["esri/config", "esri/Map", "esri/layers/VectorTileLayer", "esri/views/MapView", "esri/layers/TileLayer", "esri/Graphic", "esri/layers/GraphicsLayer", "esri/layers/WebTileLayer", "esri/layers/GeoJSONLayer", "esri/symbols/SimpleMarkerSymbol", "esri/renderers/UniqueValueRenderer", "esri/renderers/SimpleRenderer", "esri/widgets/LayerList", "esri/layers/GroupLayer", "esri/rest/support/Query", "esri/widgets/Search", "esri/layers/FeatureLayer", "esri/widgets/Bookmarks", "esri/widgets/Expand","esri/layers/TileLayer", "esri/symbols/CIMSymbol", "esri/layers/support/LabelClass", "esri/layers/MapImageLayer", "esri/Basemap", "esri/rest/support/Query"],
  function (esriConfig, Map, VectorTileLayer, MapView, TileLayer, Graphic, GraphicsLayer, WebTileLayer, GeoJSONLayer, SimpleMarkerSymbol, UniqueValueRenderer, SimpleRenderer, LayerList, GroupLayer, Query, Search, FeatureLayer, Bookmarks, Expand, TileLayer, CIMSymbol, LabelClass, MapImageLayer, Basemap, Query) {
      // esriConfig.apiKey = "AAPK5f601af9967543d6bc498db5a6b0f84bpHLpA-1hb11KUYm2IfzgmzBATsNlgD24Rjueqj2sKqaVsz3d6vU-6-l1yb-0YTi3";
      esriConfig.apiKey = "AAPKbf2fbfc0f4f5469d8520ecee766989aaFU4P9UKZIP2TvrGoyjZRYQleJ6QWxf-ZOQgBBaGjor0zJkHYCEH701bI8oJYzxB4";
      // console.log("Loading vector tiles!");

      var selectionLayer = new GraphicsLayer();
      var resultslayer = new GroupLayer();

      // const gravitymainstiles = new VectorTileLayer({
      //   // title: "Gravity Mains",
      //   title:"Gravity Mains",
      //   // Hide from layer list
      //   listMode: "hide",
      //   // url: "https://vectortileservices3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/Gravity_Mains_VTL/VectorTileServer",
      //   url: "https://vectortileservices3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/Gravity_Mains_VTL/VectorTileServer/resources/styles/root.json",
      //   minscale: 2311162.217155,
      //   maxscale: 15000
      // });

      // const gravitymainstiles = new TileLayer({
      //   // title: "Gravity Mains",
      //   title:"Gravity Mains",
      //   // Hide from layer list
      //   listMode: "hide",
      //   url: "https://vectortileservices3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/Gravity_Mains_VTL/VectorTileServer",
      //   minscale: 2311162.217155,
      //   maxscale: 15000
      // });

      const gravitymainsFeatures = new FeatureLayer({
        title: "Gravity Mains",
        url: "https://services3.arcgis.com/NfAw5Z474Q8vyMGv/ArcGIS/rest/services/Gravity_Mains_2ft_Simplify_/FeatureServer/0",
        minScale: 25000
      });

      const lateralFeatures = new FeatureLayer({
        title: "Laterals",
        url: "https://services3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/Laterals_2ft_Simplify/FeatureServer/0",
        minScale: 25000
      });


      // const lateraltiles = new VectorTileLayer({
      //   title: "Laterals",
      //   url: "https://vectortileservices3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/Laterals/VectorTileServer"
      // });


      const inletFeatures = new FeatureLayer({
        title: "Inlets",
        url: "https://services3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/inlets_wgs84/FeatureServer/0",
        minScale: 15000
      });
      // const inlettiles = new VectorTileLayer({
      //     title: "Inlets",
      //     url: "https://vectortileservices3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/Inlets/VectorTileServer",
      //     minScale: 15000
      //    });

      // const mhtiles = new VectorTileLayer({
      //      title: "Maintenance Holes",
      //      url: "https://vectortileservices3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/MaintenanceH_oles/VectorTileServer",
      //      minScale: 15000
      //     });

      const mhFeatures = new FeatureLayer({
        title: "Maintenance Holes",
        url: "https://services3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/maintenanceholes_84/FeatureServer/0",
        minScale: 15000
      });

      // const ottiles = new VectorTileLayer({
      //   title: "Outlets",
      //   url: "https://vectortileservices3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/Outlets/VectorTileServer",
      //   minScale: 15000
      //  });

       const olFeatures = new FeatureLayer({
        title: "Outlets",
         url: "https://services3.arcgis.com/NfAw5Z474Q8vyMGv/arcgis/rest/services/outlets_WGS84/FeatureServer/0",
         minScale: 15000
       });

       // const laCoParcels = new FeatureLayer({
       // Use image layer instead, data are requested from server as a raster file instead of vector data
       const laCoParcels = new MapImageLayer({
         title: "LA County Parcels",
         // url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0",
         url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer",
         minscale: 15000,
         visible: false
         // sublayers: [{
         //   id: 0,
         //   labelsVisible: true,
         //   labelingInfo: parcelLabeling
         // }]
       })

       const laCoParcelsFilter = new FeatureLayer({
         title: "Possible Source Parcels",
         url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0",
         renderer: parcelFilterBorder,
         labelingInfo: parcelFilterLabel,
         popupTemplate: popupfilteredparcels
       })

       const laCoCities = new MapImageLayer({
       // const laCoCities = new FeatureLayer({
         title: "LA County Cities",
         // url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/19",
         url: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/",
         // url: "https://dpw.gis.lacounty.gov/dpw/rest/services/PW_Open_Data/MapServer",
         sublayers: [{
           id: 19,
           renderer: cityBorder,
           // labelsVisible: true,
           // labelingInfo: cityLabel,
         }]
         // labelingInfo: cityLabel,
         // renderer: cityBorder
       })

       const laCoBoundary = new MapImageLayer({
       // const laCoBoundary = new FeatureLayer({
         title: "LA County Boundary",
         url: "https://dpw.gis.lacounty.gov/dpw/rest/services/PW_Open_Data/MapServer",
         // url: "https://dpw.gis.lacounty.gov/dpw/rest/services/PW_Open_Data/MapServer/13",
         // renderer: countyCIM
         // renderer: countyBorder
         sublayers: [{
           id: 13,
           renderer: countyBorder
         }]
       })

       const riversChannels = new MapImageLayer({
       // const riversChannels = new FeatureLayer({
         title: "Major Rivers and Channels",
         // url: "https://dpw.gis.lacounty.gov/dpw/rest/services/dynamicLayers/MapServer/1",
         url: "https://dpw.gis.lacounty.gov/dpw/rest/services/dynamicLayers/MapServer",
         visible: false,
         sublayers: [{
           id: 1,
         }]
       })

       const watersheds = new FeatureLayer({
         title: "Watersheds",
         url: "https://dpw.gis.lacounty.gov/dpw/rest/services/dynamicLayers/MapServer/0",
         visible: false
       })

      const networklayer = new GroupLayer({
          id: "networklayer",
          title: "Storm Network",
          layers: [lateralFeatures, gravitymainsFeatures, inletFeatures, mhFeatures, olFeatures]
        });

        const ancilData = new GroupLayer({
          id: "AncilGroup",
          title: "Ancillary Data",
          layers: [laCoCities, laCoBoundary, riversChannels, watersheds, laCoParcels],
          visible: true
        })


      // Add customized esri topo basemap as a vector tile layer using its AGOL ID
      const customVTL = new VectorTileLayer({
        portalItem: {
          id: "3fa74fed129c4276ac3bf41eefdad6ac"
        }
      });

      // create basemap object from vector tile layer
      const custombasemap = new Basemap({
        baseLayers: [
          customVTL
        ]
      });

      // Init map with the custom vector basemap
      const map = new Map({
        // basemap: "arcgis-topographic", // Basemap layer service
        // Custom edited basemap
        basemap: custombasemap,
        layers: [networklayer, ancilData] // vector tile layer
      });
      const view = new MapView({
        map: map,
        center: [-118.167416, 33.784257], // Longitude, latitude
        zoom: 13, // Zoom level
        container: "viewDiv", // Div element
      });
      const searchWidget = new Search({
        view: view
      });
      view.ui.add(searchWidget, {
        position: "top-right",
        index: 2
      });

      // Add window for viewing current zoom scale
      view.ui.add(vScale, 'bottom-right')

      const bookmarks = new Bookmarks({
        view: view,
        // allows bookmarks to be added, edited, or deleted
        editingEnabled: true
      });

      const bkExpand = new Expand({
         view: view,
         content: bookmarks,
         expanded: false
       });
       view.ui.add(bkExpand, "top-right", 0);

      view.ui.add("traceDiv", "top-left");

      layerList = new LayerList({
        view
      });

      view.ui.add(layerList, "top-right");


      // Watch scale/zoom changes, update current scale display
      view.watch('scale', function(evt){
        document.getElementById('vScale').innerHTML = '1:' + evt.toFixed(2);
      });

      view.on("click", (event) => {
        // console.log("click event: ", event);
        console.log("x(lon):", event.mapPoint.x.toFixed(2));
        console.log("y(lat):", event.mapPoint.y.toFixed(2));
        // esriTilequery([event.mapPoint.longitude, event.mapPoint.latitude], gravMainsTileURL)
        document.getElementById("NoSelAlert").removeAttribute('active');
        console.log(blockBtn);
        // Check if selection button is active
        if (btnActive === "active"){
          view.popup.autoOpenEnabled = false;
          // Set global variables of user's selection:
          userLong = event.mapPoint.longitude;
          userLat = event.mapPoint.latitude;
          map.remove(selectionLayer);
          view.graphics.remove(selectionLayer);
          console.log("Selection is active!");
          const selectionpoint = new Graphic({
            title:"Start Point",
            geometry: {
               type: "point",
               longitude: event.mapPoint.longitude,
               latitude: event.mapPoint.latitude
             },
             symbol: selectionMarkerSymbol
          });
          selectionLayer = new GraphicsLayer({
            id: "selectionLayer",
            title: "Selected Start Point",
            graphics: [selectionpoint]
          });
          // selectionLayer.add(selectionpoint);
          map.add(selectionLayer);
          btnActive = null;
        }
        // Active block button logic
        if (blockBtn==="active"){
          view.popup.autoOpenEnabled = false;
          // Add block lnglat array
          // blockList.push({"lng":event.mapPoint.longitude,"lat":event.mapPoint.latitude})
          blockList.push([event.mapPoint.longitude,event.mapPoint.latitude])
          console.log("Block selection active!")

          // Get list of IDs of all layers in the map
          activeLayerIDs = []
          map.layers.forEach((item, i) => {
              activeLayerIDs.push(item.id)
            }
          );

          // Create a graphic point
          const blockPoint = new Graphic({
            title:"Block Points",
            geometry: {
               type: "point",
               longitude: event.mapPoint.longitude,
               latitude: event.mapPoint.latitude
             },
             symbol: blockingMarkerSymbol
          });
          // If blocking layer doesn't exist in the map, create it
          if (!activeLayerIDs.includes("blockingLayer")){
            blockingLayer = new GraphicsLayer({
              id: "blockingLayer",
              title: "Selected Block Points"
            });
            // Add layer to map
            map.add(blockingLayer);
          }
          // Add new block point to blocking layer
          blockingLayer.graphics.add(blockPoint);
        }
        // Re-enable popups, if disabled for button usage
        view.popup.autoOpenEnabled = true;
      });
      document.addEventListener("pointermove", function(){
        if ((btnActive === "active") ||(blockBtn === "active")){
          console.log("crosshair cursor active!")
          // Set crosshair cursor
          document.body.style.cursor = "crosshair";
          // Disable popups
          view.popup.autoOpenEnabled = false;
        } else {
            document.body.style.cursor = "default";
            view.popup.autoOpenEnabled = true;
            // Enable popups
          }
      });
      document.getElementById("selBtn").addEventListener("click", function(){
        console.log("selection active!");
        userLat = null;
        userlon = null;
        btnActive = "active";
        blockBtn = "inactive";
      });
      document.getElementById("block-Btn").addEventListener("click", function(){
        console.log("Block selection active!");
        blockBtn = "active";
        btnActive = "inactive";
      });
      document.getElementById("clearBtn").addEventListener("click", function(){
              console.log("Clearing results!")
              map.remove(selectionLayer);
              map.remove(resultslayer);
              view.graphics.remove(selectionLayer);
              view.graphics.remove(resultslayer);
              // Check if blocking layer exists, if so remove it from map and graphics
              if (activeLayerIDs.includes("blockingLayer")){
                map.remove(blockingLayer);
                view.graphics.remove(blockingLayer);
              }
              view.popup.close();
              document.getElementById("NoSelAlert").removeAttribute('active');;
              document.getElementById("NoResultAlert").removeAttribute('active')
              userLat = null;
              userlon = null;
              btnActive = "inactive";
              blockBtn = "inactive";
              blockList = [];
              // inletResults, outletResults, mhResults, gmResults, latResults = null;
              // Hide results window
              document.getElementById("results-grp").style.display = "none";
              // Get list of results to remove, using their calcite attribute
              document.querySelectorAll("calcite-pick-list-item").forEach(e => e.remove());
              // removeList = document.querySelectorAll("calcite-pick-list-item").forEach(e => e.remove());
              // for (let i = 0; i < removeList.length; i++) {
              //   removeList[i].remove();
              // }}
            }
          )

      document.getElementById("submitBtn").addEventListener("click", function(){
            btnActive = "inactive";
            blockBtn = "inactive";
            // Clear out existing graphic layers
            // map.remove(selectionLayer);
            map.remove(resultslayer);
            // Check if a point has been clicked, if not return message
            if (userLat === null){
              //Turn alert on
              console.log("No selection!");
              // document.getElementById("NoSelAlert").classList.add("is-active");
              document.getElementById("NoSelAlert").setAttribute('active','');
              return;
            }
            document.getElementById("NoSelAlert").removeAttribute('active');
            // Get coordinates from user selection
            // Get the active radio selection to determine flow direction
            radioGrp = document.querySelector('#directionGrp');
            traceDirection = radioGrp.querySelectorAll(":checked")[0].defaultValue;
            // console.log(userLat)
            // console.log(userLong)
            // console.log(traceDirection)
            var url = new URL('http://api.leavitttesting.com:5000/api/v1/trace/lacostormwater');
            // var url = new URL('/api/v1/trace/lacostormwater')
            console.log(blockList)
            // GET query parameters
            var params = {"latitude":userLat, "longitude":userLong, "direction":traceDirection};
            if (document.getElementById("parcel-btn").hasAttribute("checked")){
              params["parcels"] = "true"
            } else {
              params["parcels"] = "false"
            };
            searchQuery = new URLSearchParams(params)
            // if blocklist exists, add each to query parameters
            if (blockList.length > 0){
              blockList.forEach((item, i) => {
                // Add to GET query parameters, key value is repeated for each item
                searchQuery.append('blocklnglats',item)
              });
            }
            // url.search = new URLSearchParams(params).toString();
            url.search = searchQuery.toString();
            // console.log(url);
            // Set Query text to active
            document.querySelector('#query-text').style.display = "block";
            // Issue Async request
            fetch(url, {method: "GET",
              mode: 'cors'})
            .then(r => {
              // Returns data
              return r.json();
            })
            .then(function(data){
              serverResponse = data
              // Object to hold ArcGIS JS API geojson formatted layers
              layerObj = {}
              function addGeoJson(geojson, title, popupTemplate){
                // Takes geojson result features returned from server and brings them in as object URLs since the GeoJSONLayer function expects a seperate URL
                // for each layer, not one URL for all
                // Check if the GeoJSON has results, if not skip it
                // if ((geojson['features'].length > 0) || (title == "Start Point")) {
                if (geojson['features'].length > 0) {
                  // Make a blob object of geojson formatted data
                  const blob = new Blob([JSON.stringify(geojson)], {type: "application/json"});
                  // Make a temporary URL that points to the client-side store previously created blob feature
                  const url  = URL.createObjectURL(blob);
                  // Create a GeoJSON layer using provided popupTemplate and previously set renderer
                  const result = new GeoJSONLayer({
                    url:url,
                    title:title,
                    renderer:resultsrenderer,
                    popupTemplate: popupTemplate
                  });
                  // Add new geojson layer to layerObj
                  layerObj[title] = result;
                }
              }

              // Process geojson result layers provided by server
              addGeoJson(data['Gravity Mains'], 'Gravity Mains', popupGM)
              addGeoJson(data['Laterals'], 'Laterals', popupLat)
              addGeoJson(data['Inlets'], 'Inlets', popupInlet)
              addGeoJson(data['startpoint'], 'Start Point', null)
              addGeoJson(data['Outlets'], 'Outlets', popupOutlet)
              addGeoJson(data['Maintenance Holes'], 'Maintenance Holes', popupMH)

              // Process parcel OID results
              if ("parcels" in data){
                // Convert results to SQL statement
                sql = "OBJECTID IN ("
                data['parcels'].forEach((item, i) => {
                  sql += `${item},`
                });
                // Remove last comma and add right ) to complete statement
                sql = sql.substring(0,sql.length-1)
                sql += ")"
                // let parcelQuery = laCoParcelsFilter.createQuery();
                // parcelQuery.where = sql
                // parcelQuery.outFields = ["APN"]
                // parcelQuery.returnGeometry = true;
                // laCoParcelsFilter.queryFeatures(parcelQuery)
                // .then(function(response){
                //   console.log(response)
                // });
                // Filter results parcel layer
                laCoParcelsFilter.definitionExpression = sql
                layerObj['Filtered Parcels'] = laCoParcelsFilter;
                // Add filtered parcel layer to map
              }
              if ("subwatersheds" in data){
                addGeoJson(data['subwatersheds'], "Subwatersheds", null)
              }

              // Add results as a group layer
              resultslayer = new GroupLayer({
                id: "resultslayer",
                title: "Trace Results",
                layers: Object.values(layerObj)
              });
              // Add group layer to map
              map.add(resultslayer);
              // Zoom to extent of gravity mains result, can't zoom to extent of group layer
              layerObj['Gravity Mains'].queryExtent().then((response) => {
                view.goTo(response.extent);
              });
              // Set Query text to inactive
              document.querySelector('#query-text').style.display = "none";
              document.getElementById("DownloadCSV").addEventListener("click", function(){
                createCSV(data)
              });
              document.getElementById("DownloadGeoJSON").addEventListener("click", function(){
                createGeoJSONZIP(data)
              });

              function buildResultsDisplay(geojsonlyr, calciteWindowID, titleText){
                //  Get count of features in geojson layer
                // if (datalyr['features'].length > 0){
                console.log(titleText);
                console.log(geojsonlyr)
                if (geojsonlyr !== undefined){
                  console.log("Populating data!");
                  var results = new Object();
                  query = new Query();
                  query.where = `factype = '${titleText}'`;
                  query.outFields = [ "factype", "id", "facsubtype", "facid"];
                  query.returnGeometry = true;
                  geojsonlyr.queryFeatures(query)
                  .then(function(response){
                      // Get object of results
                      // Get record count
                      results.count = Object.keys(response.features).length
                      console.log(results.count)
                      features = response.features;
                      // Update accordian title to show Count
                      document.getElementById(calciteWindowID).setAttribute("heading", `${titleText} (${results.count})`)
                      // Loop over each feature in result
                      features.forEach((result, index)=>{
                        attr = result.attributes;
                        item = document.createElement("calcite-pick-list-item");
                        item.setAttribute("label", attr.facid);
                        item.setAttribute("value", index);
                        // Add to service results
                        // type = `Inlet Type: ${attr[facsubtype]}`;
                        type = `${titleText} Type: ${attr.facsubtype}`;
                        if (["Inlets, Maintenance Holes"].includes(titleText)){
                          console.log(titleText)
                          description = type;
                        } else {
                          size =  `Size: ${attr.size}`;
                          material = `Material: ${attr.material}`
                          description = type + "\n" + size + "\n" + material;
                        }
                        item.setAttribute("description", description);
                        item.addEventListener("click", function(){
                          // const target = event.target;
                          // const resultId = target.getAttribute("value");
                          view.popup.open({
                            features: [result],
                            location: result.geometry
                          });
                          view.goTo(result.geometry)
                        });
                        // Append to existing results panel
                        console.log(calciteWindowID)
                        document.getElementById(calciteWindowID).appendChild(item);
                      });
                    });
                  } else {
                    console.log("Setting empty results")
                    document.getElementById(calciteWindowID).setAttribute("heading", titleText)
                  }
                }


              buildResultsDisplay(layerObj['Gravity Mains'], 'GM-Window', 'Gravity Mains')
              buildResultsDisplay(layerObj['Laterals'], 'Lat-Window', 'Laterals')
              buildResultsDisplay(layerObj['Inlets'], 'InletsWindow', 'Inlets')
              buildResultsDisplay(layerObj['Outlets'], 'OutletsWindow', 'Outlets')
              buildResultsDisplay(layerObj['Maintenance Holes'], 'MH-Window', 'Maintenance Holes')
              // Set result group to display
              document.getElementById("results-grp").style.display = "block";
               })

            .catch(error =>{
              console.log(error)
              console.log("Server request error!")
              // Set query text to error
              document.querySelector('#query-text').style.display = "none";
              document.getElementById("NoResultAlert").setAttribute('active','')
            });
      });
      document.getElementById("upstream-btn").addEventListener("click", function(){
        // Trigger if upstream button is pressed, allow user to select parcel return
        console.log("Upstream clicked!")
        document.getElementById("parcel-label").style.display = "block";
      });

      document.getElementById("downstream-btn").addEventListener("click", function(){
        // Trigger if downstream button is pressed, hide parcel option and set it to inative
        console.log("Downstream clicked!")
        document.getElementById("parcel-label").style.display = "none";
        document.getElementById("parcel-btn").removeAttribute("checked");
      });
      // document.getElementById("toolloader").removeAttribute('active');
  });
;
