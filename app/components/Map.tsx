"use client"; // ensures this runs only in the browser

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = "pk.eyJ1IjoiemV1bWVyIiwiYSI6ImNtZml3YzZubjB0cmsyanBybmJ5azhzM3YifQ.Ww8jYLumGywIix21FJTuEA";

const INITIAL_CENTER = [
  -77.4892,
  35.5774
]
const INITIAL_ZOOM = 16.27


const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [center, setCenter] = useState(INITIAL_CENTER)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/zeumer/cmfke8ku0004101r8dw830u2h",
      center: center,
      zoom: zoom,
    });

    map.current.on("move", () => {
      const mapCenter = map.current.getCenter()
      const mapZoom = map.current.getZoom()
      setCenter([ mapCenter.lng, mapCenter.lat ])
      setZoom(mapZoom)
    });

    map.current.on('click', (event) => {
      // If the user clicked on one of your markers, get its information.
      const features = map.current.queryRenderedFeatures(event.point, {
        layers: ['choropleth-fill'] // replace with your layer name
      });
      if (!features.length) {
        return;
      }
      const feature = features[0];
      console.log(feature)
      const popup = new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(feature.geometry.coordinates[0][3])
        .setHTML(
        `<h3>${feature.properties.mean_val.toFixed(2)} bu/acre</h3>`
        )
        .addTo(map.current);

      // Code from the next step will go here.
    });


    // Add a new source to the map using the tileset ID
    /*
    map.current.on('load', () => {
      map.current.addSource('clustered-data', {
        type: 'vector',
        url: 'mapbox://zeumer.cafe-locations-clustered'
      });

      map.current.addLayer({
        id: 'locations',
        type: 'circle',
        source: 'clustered-data',
        'source-layer': 'locations',
        filter: ['has', 'count'],
        paint: {
        'circle-color': [
          'step',
          ['get', 'count'],
          '#51bbd6',
          10, // If count is 10 or less, color is #51bbd6
          '#f1f075',
          20, // If count is 20 or less, color is #f1f075
          '#f28cb1',
          75, // If count is 75 or less, color is #f28cb1, If count is greater than 75, color is #ac41bf       
          '#ac41bf'
          ],
          'circle-opacity': 0.8,
          'circle-radius': [
            'step', 
            ['get', 'count'], 
            5, 
            2, // If count is 2 or less, radius is 5
            12, 
            10, // If count is 10 or less, radius is 12
            17, 
            20, // If count is 20 or less, radius is 17
            25, 
            50, // If count is 50 or less, radius is 25
            32, 
            100, // If count is 100 or less, radius is 32 otherwise radius is 40
            40
          ]
        }
      })  

      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'clustered-data',
        'source-layer': 'locations',
        filter: ['>', ['get', 'count'], 1], // Only show count if greater than 1
        paint: {
          'text-color': '#ffffff', 
          'icon-color-contrast': 1
        },
        layout: {
          'text-field': ['get', 'count'],
          'text-font': ["Open Sans Regular","Arial Unicode MS Regular"],
          'text-size': 12
        }
      });

      map.current.on('click', (event) => {
        // If the user clicked on one of your markers, get its information.
        const features = map.current.queryRenderedFeatures(event.point, {
          layers: ['YOUR_LAYER_NAME'] // replace with your layer name
        });
        if (!features.length) {
          return;
        }
        const feature = features[0];
    });
    */

    

    // map.current.addControl(new mapboxgl.NavigationControl());
  }, []);

  const handleButtonClick = () => {
    console.log("here")
    map.current.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
    })
  }

  return (
    <>
      <div className="sidebar">
        Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} | Zoom: {zoom.toFixed(2)}
      </div>
      <button className='reset-button' onClick={handleButtonClick}>
        Reset
      </button>
      <div id='map-container' ref={mapContainer} style={{ width: "100%", height: "100vh" }}/>
    </>
  )
};

export default Map;
