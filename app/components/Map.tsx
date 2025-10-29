"use client"; // ensures this runs only in the browser

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Geometry, Point, Polygon, LineString } from "geojson";

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;
mapboxgl.accessToken = "pk.eyJ1IjoiemV1bWVyIiwiYSI6ImNtZml3YzZubjB0cmsyanBybmJ5azhzM3YifQ.Ww8jYLumGywIix21FJTuEA"

const INITIAL_CENTER: [number, number] = [-77.4892, 35.5774];

const INITIAL_ZOOM = 16.27


const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [layerMode, setLayerMode] = useState<"yield" | "weed-map" | "elevation-map">("yield");

  const [center, setCenter] = useState<mapboxgl.LngLat>(new mapboxgl.LngLat(INITIAL_CENTER[0], INITIAL_CENTER[1]))
  const [zoom, setZoom] = useState(INITIAL_ZOOM)

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard-satellite',
      center: center,
      zoom: zoom,
    });

    map.current.on('load', () => {

      map.current!.addSource('hexes-source', {
        type: 'vector',
        url: 'mapbox://zeumer.8flnfcsu'
      });

      map.current!.addLayer({
        id: 'hexes-filled',
        type: 'fill', 
        source: 'hexes-source',
        'source-layer': 'vector-layers-53w9jh', 
        paint: {
          'fill-color': [
              'interpolate',
              ['exponential', 1],
              ['get', 'yield'],
              13.47879355294364, '#ec2e27',
              61.0588, '#efd82a',
              108.63873291015624, '#1fc773'
          ],
          'fill-opacity': 0.8
        },
        filter: ['all',
    ['has', 'yield'],
    ['!=', ['get', 'yield'], 'undefined']
  ]
      });

      map.current!.addLayer({
        id: 'hexes-highlight',
        type: 'fill',
        source: 'hexes-source',
        'source-layer': 'vector-layers-53w9jh',
        paint: {
          'fill-color': '#000000',
          'fill-opacity': 0.3
        },
        filter: ['==', 'h3_index', ''] // start with nothing highlighted
      });

      // On mouse move, update the filter to highlight the hovered hex
      map.current!.on('mousemove', 'hexes-filled', (e) => {
        if (e.features!.length > 0) {
          const hexIndex = e.features![0].properties!.h3_index;
          map.current!.setFilter('hexes-highlight', ['==', 'h3_index', hexIndex]);
        }
      });

      // On mouse leave, clear the highlight
      map.current!.on('mouseleave', 'hexes-filled', () => {
        map.current!.setFilter('hexes-highlight', ['==', 'h3_index', '']);
      });

      
    });

    map.current!.on("move", () => {
      const mapCenter = map.current!.getCenter()
      const mapZoom = map.current!.getZoom()
      setCenter(mapCenter)
      setZoom(mapZoom)
    });

    map.current!.on('click', (event) => {
      // If the user clicked on one of your markers, get its information.
      const features = map.current!.queryRenderedFeatures(event.point, {
        layers: ['hexes-filled'] // replace with your layer name
      });
      if (!features.length) {
        return;
      }
      const feature = features[0];

      if ("coordinates" in feature.geometry) {
        const coordinates = (feature.geometry as Point | Polygon | LineString).coordinates;
        let lat_sum = 0;
        let lon_sum = 0;
        let count = 0;
        for (const coordinate of coordinates[0] as [number, number][]) {
          lat_sum += coordinate[1];
          lon_sum += coordinate[0];
          count++;
        }
        const meanCoordinates = [lon_sum / count, lat_sum / count];

        new mapboxgl.Popup({ offset: [0, -15] })
          .setLngLat(meanCoordinates as [number, number])
          .setHTML(
          `<h3>${feature.properties!.yield.toFixed(2)} bu/acre</h3>`
          )
          .addTo(map.current!);
      }

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
    map.current!.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
    })
  }

  const handleModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value as "yield" | "weed-map" | "elevation-map";
      setLayerMode(value);

      if (!map.current?.getLayer("hexes-filled")) return;

      let fillExpression: mapboxgl.Expression;

      if (value === "yield") {
        fillExpression = [
          "interpolate",
          ["exponential", 1],
          ["get", "yield"],
          13.47879355294364,
          "#ec2e27",
          61.0588,
          "#efd82a",
          108.63873291015624,
          "#1fc773",
        ];
      } else if (value === "weed-map") {
        fillExpression = [
          "interpolate",
          ["linear"],
          ["get", "weed-map"], // replace with your actual weed property
          0,
          "hsl(29, 100%, 74%)",
          0.470588,
          "hsl(11, 91%, 49%)",
          0.9411764705882352,
          "hsl(0, 100%, 24%)"
        ];
      } else {
        fillExpression = [
          "interpolate",
          ["exponential", 1],
          ["get", "elevation-map"],
          20.288036346435547,
          "hsl(100, 98%, 24%)",
          22.4424,
          "hsl(102, 43%, 52%)",
          24.596847534179688,
          "hsl(100, 82%, 85%)",
        ];
      }

      map.current.setPaintProperty("hexes-filled", "fill-color", fillExpression);
  }

  return (
    <>
      <div className="sidebar">
        Longitude: {center.lng.toFixed(4)} | Latitude: {center.lat.toFixed(4)} | Zoom: {zoom.toFixed(2)}
      </div>
      <button className='reset-button' onClick={handleButtonClick}>
        Reset
      </button>
      <div className="radio-button">
        <label>
          <input
            className="radio-select"
            type="radio"
            name="mode"
            value="yield"
            checked={layerMode === "yield"}
            onChange={handleModeChange}
          />
           Yield
        </label>
        <br />
        <label>
          <input
            className="radio-select"
            type="radio"
            name="mode"
            value="weed-map"
            checked={layerMode === "weed-map"}
            onChange={handleModeChange}
          />
          Weed pressure
        </label>
        <br />
        <label>
          <input
            className="radio-select"
            type="radio"
            name="mode"
            value="elevation-map"
            checked={layerMode === "elevation-map"}
            onChange={handleModeChange}
          />
          Elevation
        </label>
      </div>
      <div id='map-container' ref={mapContainer} style={{ width: "100%", height: "100vh" }}/>
    </>
  )
};

export default Map;
