# Entity Linking service

This service takes an annotation of the Named Entity Recognition (NER) service and creates a new annotation with the detected entity linked to a URI in a base registry.

## Example of input and result container

### Input

The entity-linking task requires an input container that holds an `task:hasResource` linking to an Named Entity Recognition (NER) annotation.

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
    oa:hasTarget <https://data.arendonk.be/id/besluiten/24.1125.2636.6731/expression/en> .
    
  named_entity_recognition_result_1 a foaf:Person ;
    rdfs:label "Jan Jansen" .
    
<https://data.arendonk.be/id/besluiten/24.1125.2636.6731/expression/en> a eli:Expression ;
  epvoc:expressionContent "Text of decision in English where Jan Jansen is mentioned"@en .
  
<https://data.arendonk.be/id/besluiten/24.1125.2636.6731/work> a eli:Work ;
  eli:is_realized_by <https://data.arendonk.be/id/besluiten/24.1125.2636.6731/expression/en> .
```

## Result container

The result container refers to a Named Entity Linking (NEL) annotation with the `task:hasResource` predicate. The annotation has the some body and target as the NER annotation, except that the body now also has a `skos:exactMatch` predicate linking to an existing URI of the entity.

```
<http://redpencil.data.gift/id/task/2bc84790-f614-11f0-b711-d76440bfffff> a task:Task ;
  # see above for other triples
	ns6:status	adms:success ;
	task:inputContainer	<http://redpencil.data.gift/id/dataContainers/696F9E4321DBD10C4225E130> ;
  task:resultContainer <http://redpencil.data.gift/id/dataContainers/0429b49a-1596-41d3-a836-196584db7b30> .

  <http://redpencil.data.gift/id/dataContainers/0429b49a-1596-41d3-a836-196584db7b30> a	task:DataContainer ;
	mu:uuid	"0429b49a-1596-41d3-a836-196584db7b30" ;
	task:hasResource	example:myNELAnnotation .

  <http://data.lblod.info/id/annotations/89b53d7a-af6e-46e1-9c61-6de8b5d0f196> a oa:Annotation ;
    mu:uuid "89b53d7a-af6e-46e1-9c61-6de8b5d0f196" ;
    oa:hasBody skolem:named_entity_linking_result_1 ;
    nif:confidence 0.70 ;
    oa:motivatedBy oa:linking ;
    oa:hasTarget <https://data.arendonk.be/id/besluiten/24.1125.2636.6731/expression/en> .
    
  named_entity_linking_result_1 a foaf:Person ;
    rdfs:label "Jan Jansen" ;
    skos:exactMatch <http://example.org/id/person/0429b49a-1596-41d3-a836-196584db7b30> .
    
<https://data.arendonk.be/id/besluiten/24.1125.2636.6731/expression/en> a eli:Expression ;
  epvoc:expressionContent "Text of decision in English where Jan Jansen is mentioned"@en .
  
<https://data.arendonk.be/id/besluiten/24.1125.2636.6731/work> a eli:Work ;
  eli:is_realized_by <https://data.arendonk.be/id/besluiten/24.1125.2636.6731/expression/en> .

```

## API

### POST `delta`

This is the endpoint that is configured in the `delta-notifier`. It returns a
status `200` as soon as possible, and then interprets the JSON body to filter
out tasks with the corrert operation and status to process and processes them
one by one.

### POST `find-and-start-unfinished-tasks`

This will scan the triplestore for tasks that are not finished yet (`busy` or
`scheduled`) and restart them one by one. This can help to recover from
failures. The scanning and restarting is also done on startup of the service.
This does not require a body and the returned status will be `200 OK`.

### POST `force-retry-task`

This endpoint can be used to manually retry a task. It does not matter what
state the task is in. The task can even be in failed state. It will be retried
anyway.

**Body**

Send a JSON body with the task URI, e.g.:

```http
Content-Type: application/json

{
  "uri": "http://redpencil.data.gift/id/task/e975b290-de53-11ed-a0b5-f70f61f71c42"
}
```

**Response**

`400 Bad Request`

This means that the task URI could not be found in the request.

`200 OK`

The task will be retried immediately after.

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

## Development

Add the following snippet to your `docker-compose.override.yml` to develop:

```
entity-linking:
    ports:
      - "8881:80"
    environment:
      NODE_ENV: "development"
    volumes:
      - /path/to/your/entity-linking-service/:/app
```