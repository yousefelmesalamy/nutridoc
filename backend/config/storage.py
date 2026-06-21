from django.conf import settings
from django.core.files.storage import FileSystemStorage


class AbsoluteURLFileSystemStorage(FileSystemStorage):
    """Returns absolute URLs so uploaded media resolves correctly when the
    HTML containing them (e.g. blog post bodies) is rendered on a different
    origin, such as the Angular dev server."""

    def url(self, name):
        return settings.BACKEND_BASE_URL + super().url(name)
