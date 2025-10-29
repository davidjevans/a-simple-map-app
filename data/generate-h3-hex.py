import logging
from pathlib import Path

import geopandas as gpd
import h3
from shapely.geometry import Polygon
from rasterstats import zonal_stats
from absl import app, flags

FLAGS = flags.FLAGS

flags.DEFINE_string('boundary_geojson', None, 'Path to the boundary GeoJSON file.', required=True)
flags.DEFINE_list('raster_tifs', None, 'Path to the raster TIFF file.', required=True)
flags.DEFINE_string('output_geojson', None, 'Path to the output GeoJSON file.', required=True)
flags.DEFINE_integer('resolution', 14, 'H3 resolution (smaller number = bigger hexes).')

def main(argv):
    # --- 1. Load your AOI boundary from GeoJSON ---
    boundary_gdf = gpd.read_file(FLAGS.boundary_geojson)
    boundary_gdf = boundary_gdf.to_crs(epsg=4326)

    # --- 2. Generate H3 hexes that cover this boundary ---
    boundary_coords = boundary_gdf.geometry.union_all().__geo_interface__  # GeoJSON-like dict
    geojson_coords = boundary_coords['coordinates'][0]
    latlon_coords = [(lat, lon) for lon, lat in geojson_coords]
    poly = h3.LatLngPoly(latlon_coords)
    hexes = h3.h3shape_to_cells(poly, res=FLAGS.resolution)

    cell_boundaries = []
    for hex in hexes:
        boundary = h3.cell_to_boundary(hex)
        cell_boundaries.append(Polygon([(lon, lat) for lat, lon in boundary]))
    hex_gdf = gpd.GeoDataFrame({"h3_index": hexes, "geometry": cell_boundaries}, crs=4326)

    # --- 4. Run zonal statistics on each hex ---
    stats = {}
    for raster_tif in FLAGS.raster_tifs:
        logging.info(f"Processing {raster_tif}")
        raster_layer_name = Path(raster_tif).stem
        layer_stats = zonal_stats(
            hex_gdf['geometry'], raster_tif,
            stats=["mean"],
            nodata=None,
            geojson_out=True
        )
        stats[raster_layer_name] = layer_stats

    # --- 5. Attach results back to GeoDataFrame ---
    for layer_name, layer_stats in stats.items()    :
        for i, s in enumerate(layer_stats):
            if layer_name == 'weed-map' and s["properties"]["mean"] is not None:
                hex_gdf.loc[i, layer_name] = 1 - s["properties"]["mean"]
            else:
                hex_gdf.loc[i, layer_name] = s["properties"]["mean"]

    logging.info("Writing to file")
    hex_gdf.to_file(FLAGS.output_geojson, driver="GeoJSON")

if __name__ == '__main__':
    app.run(main)
