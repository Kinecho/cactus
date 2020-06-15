gcloud tasks queues create user-prompt-notifications 2> /dev/null || echo "user-prompt-notifications already exists"

gcloud tasks queues update user-prompt-notifications \
 --max-attempts=5 \
 --max-concurrent-dispatches=100  \
 --max-dispatches-per-second=50
