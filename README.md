# Entity Linking service

This service takes an annotation of the Named Entity Recognition (NER) service and creates a new annotation with the detected entity linked to a URI in a base registry.

## Input

```
@prefix example: <http://www.example.org/> .
  @prefix oa: <http://www.w3.org/ns/oa#> .
  @prefix mu: <http://mu.semte.ch/vocabularies/core/> .
  @prefix prov: <http://www.w3.org/ns/prov#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  @prefix dcterms: <http://purl.org/dc/terms/> .
  @prefix skolem: <http://www.example.org/id/.well-known/genid/> .
  @prefix eli: <http://data.europa.eu/eli/ontology#> .
  @prefix task: <http://redpencil.data.gift/vocabularies/tasks/> .
  
  <http://redpencil.data.gift/id/task/2bc84790-f614-11f0-b711-d76440bfffff> a task:Task ;
	dcterms:created	"2026-01-20T15:24:54.281Z"^^xsd:dateTime ;
	dcterms:modified	"2026-01-20T15:24:56.648Z"^^xsd:dateTime ;
	mu:uuid	"2bc84790-f614-11f0-b711-d76440bfffff" ;
	dcterms:isPartOf	<http://redpencil.data.gift/id/job/696F9E4321DBD10C4225E12D> ;
	task:operation <http://lblod.data.gift/id/jobs/concept/TaskOperation/entity-linking> ;
	ns6:status	adms:scheduled ;
	ns1:index	"1" ;
	task:inputContainer	<http://redpencil.data.gift/id/dataContainers/696F9E4321DBD10C4225E130> ;
	task:dependsOn	<http://redpencil.data.gift/id/task/696F9E4421DBD10C4225E131> .

<http://redpencil.data.gift/id/dataContainers/696F9E4321DBD10C4225E130> a	task:DataContainer ;
	mu:uuid	"696F9E4321DBD10C4225E130" ;
	task:hasResource	example:myNERAnnotation .

  example:myNERAnnotation a oa:Annotation ;
    mu:uuid "0ab45594-9909-4aea-a7d9-63476ffe6e97" ;
    oa:hasBody skolem:named_entity_recognition_result_1 ;
    nif:confidence 0.87 ;
    oa:motivatedBy oa:tagging ;
    oa:hasTarget <https://data.arendonk.be/id/besluiten/24.1125.2636.6731/work> .
    
  named_entity_recognition_result_1 a foaf:Person ;
    rdfs:label "Jan Jansen" .
    
<https://data.arendonk.be/id/besluiten/24.1125.2636.6731/expression/en> a eli:Expression ;
  epvoc:expressionContent "Text of decision in English where Jan Jansen is mentioned"@en .
  
<https://data.arendonk.be/id/besluiten/24.1125.2636.6731/work> a eli:Work ;
  eli:is_realized_by <https://data.arendonk.be/id/besluiten/24.1125.2636.6731/expression/en> .
```

## Output

```

```

## Usage

Add the following to your docker-compose file:

```yml
entity-linking:
  image: lblod/entity-linking-service
  environment:
            TARGET_GRAPH: "http://mu.semte.ch/graphs/public"
            DEFAULT_GRAPH: "http://mu.semte.ch/graphs/harvesting"
            HIGH_LOAD_DATABASE_ENDPOINT: http://triplestore:8890/sparql
   links:
    - database:database
```

Add the delta rule:

```json
{
  "match": {
    "predicate": {
      "type": "uri",
      "value": "http://www.w3.org/ns/adms#status"
    },
    "object": {
      "type": "uri",
      "value": "http://redpencil.data.gift/id/concept/JobStatus/scheduled"
    }
  },
  "callback": {
    "method": "POST",
    "url": "http://entity-linking-service/delta"
  },
  "options": {
    "resourceFormat": "v0.0.1",
    "gracePeriod": 1000,
    "ignoreFromSelf": true,
    "foldEffectiveChanges": true
  }
}
```
