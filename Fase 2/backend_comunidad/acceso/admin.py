from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from acceso.models import AccessPermission,TemplateAccess
 
# Register your models here.
class AccessPermissionAdmin(ImportExportModelAdmin):
    list_display = ('titulo','group')
    list_filter = ('group','empresa','templates','titulo')

admin.site.register(AccessPermission,AccessPermissionAdmin)

class TemplateAccessAdmin(ImportExportModelAdmin):
    list_display = ('name',)
    list_filter = ('name',)
    search_fields = ('name',)

admin.site.register(TemplateAccess,TemplateAccessAdmin)