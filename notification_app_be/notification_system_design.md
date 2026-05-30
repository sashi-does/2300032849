# Notification System Design

## Stage 5

### Problems in Current Design

1. if `send_email()` fails, the loop stops and some students never receive notifications.
2. email, DB save, and app notification are tightly coupled (main problem difficult to scale individually).
3. no retry mechanism for failed emails may be eventual retries can be made with introducing brokers.
4. processing 50,000 students sequentially will be slow.

### What if 200 Emails Fail?

failed students should be added to a retry queue and retried later. The system should not stop processing the remaining students.

### Should DB Save and Email Sending Happen Together?

No.

saving to the database should happen first because it is the source of truth. Email and app notifications can be sent asynchronously by background workers. This makes the system more reliable and scalable.

### Revised Pseudocode

```text
function notify_all(student_ids, message):

    for student_id in student_ids:
        save_to_db(student_id, message)

        add_to_email_queue(student_id, message)
        add_to_push_queue(student_id, message)


worker email_worker:
    while queue not empty:
        send_email(student_id, message)
        if failed:
            retry_later(student_id, message)


worker push_worker:
    while queue not empty:
        push_to_app(student_id, message)
```

