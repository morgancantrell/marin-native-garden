# Marin Native Garden Plant Selection Logic

## Overview
This document explains how plants are selected and assigned to plant communities in the Marin Native Garden Planner. The system is designed to provide botanically accurate, ecologically appropriate plant recommendations for Marin County, California.

## Plant Selection Criteria

### 1. Native Status Definition
A **native plant** is defined as a species that:
- Occurs naturally in Marin County without human introduction
- Has evolved over time to adapt to local climate, soils, and ecological conditions
- Is part of the natural biodiversity of the region
- Supports local wildlife and ecosystem functions

### 2. Marin County Plant Communities

The system recognizes four primary plant communities in Marin County:

#### **Chaparral**
- **Distribution**: Dry, rocky slopes and ridges (e.g., Mount Tamalpais, Marin Headlands)
- **Characteristics**: Dense, evergreen shrubs adapted to poor soils and hot, dry summers
- **Key Species**: Manzanita, Ceanothus, Toyon, California Sagebrush
- **Soil**: Well-drained, rocky, nutrient-poor
- **Climate**: Hot, dry summers; mild, wet winters

#### **Oak Woodland**
- **Distribution**: Rolling hills and valleys throughout Marin County
- **Characteristics**: Open canopy dominated by coast live oaks with diverse understory
- **Key Species**: Coast Live Oak, California Bay Laurel, Coffeeberry
- **Soil**: Well-drained, moderate fertility
- **Climate**: Moderate temperatures, seasonal moisture

#### **Grassland**
- **Distribution**: Open, sunny areas (e.g., Novato, parts of San Rafael)
- **Characteristics**: Native perennial and annual grasses with wildflowers
- **Key Species**: Purple Needlegrass, California Poppy, Sky Lupine
- **Soil**: Various, often clay-based
- **Climate**: Seasonal rainfall patterns, periodic drought

#### **Riparian**
- **Distribution**: Along streams, rivers, and wetlands
- **Characteristics**: Moisture-loving species adapted to seasonal flooding
- **Key Species**: Redtwig Dogwood, California Gray Rush, Blue Elderberry
- **Soil**: Moist to saturated, rich in organic matter
- **Climate**: Higher humidity, seasonal flooding

### 3. Plant Community Assignment Logic

Plants are assigned to communities based on:

#### **Ecological Habitat Requirements**
- **Soil moisture tolerance**: Riparian plants require moist soils; chaparral plants tolerate drought
- **Sun exposure**: Grassland plants need full sun; oak woodland plants tolerate partial shade
- **Elevation range**: Some species are restricted to specific elevation zones
- **Slope aspect**: North-facing slopes support different species than south-facing

#### **Historical Distribution Records**
- **Herbarium records**: Verified occurrence data from botanical collections
- **Ecological surveys**: Field observations from Marin County natural areas
- **Conservation databases**: California Native Plant Society records

#### **Ecological Associations**
- **Successional stage**: Early successional vs. climax community species
- **Disturbance tolerance**: Fire-adapted vs. fire-sensitive species
- **Wildlife relationships**: Host plants for specific butterflies/birds

### 4. Insect Support Scoring

Plants are ranked by their **Insect Support Score** (0-400+), which measures:

#### **Host Plant Value**
- **Butterfly host plants**: Species that support caterpillar development
- **Specialist relationships**: Plants supporting rare or specialized insects
- **Generalist support**: Plants supporting diverse insect communities

#### **Nectar/Pollen Resources**
- **Bloom timing**: Early/late season bloomers provide critical resources
- **Flower structure**: Accessibility to different pollinator types
- **Nectar production**: Quantity and quality of nectar resources

#### **Habitat Structure**
- **Shelter value**: Plants providing overwintering or nesting sites
- **Microclimate**: Plants creating favorable conditions for insects
- **Successional value**: Plants supporting insects throughout ecosystem development

### 5. Quality Assurance

#### **Botanical Accuracy**
- **Scientific names**: Verified against current taxonomic standards
- **Common names**: Using widely accepted regional common names
- **Growth characteristics**: Accurate mature size, growth rate, lifespan data

#### **Ecological Accuracy**
- **Community assignments**: Based on field observations and ecological literature
- **Wildlife relationships**: Verified host plant and nectar source relationships
- **Indigenous uses**: Documented traditional uses by local tribes

#### **Regional Specificity**
- **Marin County focus**: All species documented in Marin County
- **Local genotypes**: Emphasis on plants from local or regional sources
- **Climate adaptation**: Plants adapted to Marin's Mediterranean climate

## User Communication

When explaining the system to users, emphasize:

1. **Scientific Basis**: Plant selections are based on botanical and ecological research
2. **Local Focus**: All recommendations are specific to Marin County's natural communities
3. **Wildlife Support**: Plants are chosen for their value to local butterflies, birds, and other wildlife
4. **Ecological Restoration**: Recommendations support the restoration of native plant communities
5. **Cultural Heritage**: Includes traditional uses by indigenous peoples

## Continuous Improvement

The plant database is regularly updated based on:
- New botanical research and field observations
- User feedback and local expert input
- Changes in taxonomic classification
- Emerging conservation priorities

This ensures the system remains accurate and valuable for Marin County gardeners and conservation efforts.
