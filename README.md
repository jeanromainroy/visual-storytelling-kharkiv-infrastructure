# Visual Storytelling - Kharkiv's Destroyed Infrastructure

We are documenting the destruction of Kharkiv's civilian infrastructure – universities, museums, place of worship, residential apartment buildings, cemeteries, etc. Albeit digitally, our aim is to give readers the experience of walking through the city.

The research combines testimonies, on-site damage assessments, videos of the shelling incident, before/after pictures, and satellite imagery.


## Incidents Selection

1. Compile the location of shelling incidents using news articles, ongoing documentation efforts (e.g. [UNESCO](https://www.unesco.org/en/articles/damaged-cultural-sites-ukraine-verified-unesco)), and [Live Universal Awareness Map](https://liveuamap.com/en/)
 
2. Identify areas with high number of incidents

3. Further narrow the area of study through on-site assessment (i.e. driving/walking around, engaging with local authority). 

![Kharkiv's Destroyed Landmarks](./illustrations/incidents.png)


## Data Collection

### On-site

Picture of the damage, recorded/translated testimonies, noting down any details of the surrounding area, building integrity assessment. 

On-site activities took place between July 11th, 2022 and July 14th, 2022. 

### Off-site 

CCTV-like videos of the shelling (e.g. twitter, telegram, youtube), reported testimonies, social media scraping, satellite imagery, image-based building integrity assessment. Off-site data collection would have been near impossible without having had on-site experience.

**Images of the Before**

Use the regular image search, reverse image search (e.g. Google Lens), street view, geotagged images, 360deg images of Google and Yandex:

 - [Google](https://maps.google.com/)

 - [Yandex](https://yandex.ru/)


**Testimonies of Survivors** 

Some testimonies were sourced from research conducated by journalists and international NGOs. 

 - [Anyone can die at any time, Amnesty International](https://www.amnesty.org/en/latest/research/2022/06//)


**Videos of the Shelling**

Videos of the shelling incidents were sourced from news outlets, social media and war crime observers.

 - [War Evidence](https://war-evidence.mkip.gov.ua/)


**Satellite Imagery**

Satellite imagery of Kharkiv is provided by [Planet](https://www.planet.com/) as part of their [Disaster Data Programme](https://www.planet.com/disasterdata/). Here are some basic details about the instrumentation, 

| | |
| --- | --- |
| Source | [SkySat Collect](https://developers.planet.com/docs/data/skysatcollect/) |
| Ground Sampling Distance | 0.7m |
| Pixel Resolution | 0.5m |

Polygons of the incident areas were cropped before and after the shelling. Then, a command-line [script](./data/satellite-imagery/rasters/info.sh) was used to extract the [coordinates](./data/satellite-imagery/rasters/info.json) of each image. 

[Maxar](https://www.arcgis.com/apps/View/index.html?appid=91e80990481145888d648b1fad13593a)


## Building Integrity

A damage assessment is completed for each incident. Our [survey](./data/damage-assessments/questionnaire.pdf) design is based on two publications by UN-Habitat, and was reviewed by a civil engineer. 
 
 - [Beirut Municipality Rapid Building-Level Damage Assessment](https://unhabitat.org/beirut-port-explosions-response-beirut-municipality-rapid-building-level-damage-assessment) 

 - [People’s Process in Post-disaster and Post-Conflict Recovery and Reconstruction](https://unhabitat.org/people%E2%80%99s-process-in-post-disaster-and-post-conflict-recovery-and-reconstruction)



## Data Visualization

Determine the features of each incident – location (latitude/longitude), date, time, infrastructure category, severity (nbr. injured/death). 

These incidents will be overlaid on an [interactive map](./webapp/). OpenStreetMap data of the city was downloaded using [BBBike](https://extract.bbbike.org/).



## War Crime Evaluation

Hague Conventions: Rules for conducting war (1899, 1907)

Geneva Conventions: Protect the victims of war 


### International Court of Justice

2022: A complaint by Ukraine against Russia for violating the 1948 Genocide Convention, to which both Ukraine and Russia are parties, by falsely claiming genocide as a pretext for invading Ukraine.[52] The International Association of Genocide Scholars supported Ukraine, who asked for expedited provisional measures directing Russia to halt its offensive.[53] Russian representatives refused to appear.[54] On 16 March, the ICJ ordered Russia to "immediately suspend the military operations", on a 13–2 vote with the Russian and Chinese judges in opposition.[55][56] The order is binding on Russia, but the ICJ cannot enforce it.[57]


### International Criminal Court

Website: https://www.icc-cpi.int/

Ukraine: States that have signed but not ratified the Statute

Russia: Signatory that subsequently withdrew its signature

Genocide (Article 6)
Crimes against humanity (Article 7)
War crimes (Article 8)
Crimes of aggression (Article 8)



## Development

### Dependencies

 - Python 3 (Pillow, OpenCV)

 - Node.js

 - QGIS (with the GDAL command line tool)



## Authors

- [Jean-Romain Roy](https://jeanromainroy.com/), main author

- [Emmanuel Roy](https://manuroy.ca/), building infrastructure consultant
