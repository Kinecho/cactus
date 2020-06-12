PROJECT_ID="cactus-app-stage"
DATASET_ID="cactus_stage"
TABLE_ID="test_sent_prompts"
npx @firebaseextensions/fs-bq-schema-views \
  --non-interactive \
  --project=${PROJECT_ID} \
  --dataset=${DATASET_ID} \
  --table-name-prefix=${TABLE_ID} \
  --schema-files=./schema/sent_prompts.json

#  Schema files can be a list separated by a comma