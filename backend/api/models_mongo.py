from mongoengine import Document, StringField

class Task(Document):
    title = StringField(required=True)
    meta = {"collection": "tasks"}
