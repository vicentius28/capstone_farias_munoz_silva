from django.contrib import admin
from institucion.models.empresa import Empresa
from institucion.models import (
    TipoOrganizacion, Organizacion, SedeOrganizacion, 
    RelacionServicio, AsignacionTrabajador
)
from import_export.admin import ImportExportModelAdmin
from django.utils import timezone

# ============ NUEVOS MODELOS ACTIVOS ============

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ("name","empresa")
    search_fields = ("name",)

@admin.register(TipoOrganizacion)
class TipoOrganizacionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "es_prestador_servicio", "permite_multisede", "activo", "descripcion")
    list_filter = ("es_prestador_servicio", "permite_multisede", "activo")
    search_fields = ("nombre",)
    list_editable = ("activo",)


class SedeOrganizacionInline(admin.TabularInline):
    model = SedeOrganizacion
    extra = 0
    fields = ("nombre", "slug", "direccion", "theme", "activa")
    prepopulated_fields = {"slug": ("nombre",)}
    autocomplete_fields = ("theme",)


class RelacionServicioInline(admin.TabularInline):
    model = RelacionServicio
    fk_name = "organizacion_cliente"  # Especificar cuál FK usar
    extra = 0
    fields = ("empresa_servicio", "fecha_inicio", "fecha_fin", "activo")
    autocomplete_fields = ("empresa_servicio",)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "empresa_servicio":
            # Solo mostrar organizaciones que son empresas de servicio
            kwargs["queryset"] = db_field.related_model.objects.filter(
                tipo_organizacion__es_prestador_servicio=True, activa=True
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Organizacion)
class OrganizacionAdmin(ImportExportModelAdmin):
    list_display = ("nombre_corto", "nombre", "tipo_organizacion", "activa", "fecha_creacion")
    list_filter = ("tipo_organizacion", "activa", "fecha_creacion")
    search_fields = ("nombre", "nombre_corto", "rut")  # Para autocomplete
    list_editable = ("activa",)
    readonly_fields = ("fecha_creacion", "fecha_actualizacion")
    fieldsets = (
        ("Información Básica", {
            "fields": ("rut", "nombre", "nombre_corto", "tipo_organizacion", "direccion", "tipo_empresa")
        }),
        # Sección "Configuración Visual" removida - ahora está en SedeOrganizacion
        ("Estado", {
            "fields": ("activa", "fecha_creacion", "fecha_actualizacion")
        }),
    )



@admin.register(SedeOrganizacion)
class SedeOrganizacionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "organizacion", "activa")
    list_filter = ("organizacion", "activa")
    search_fields = ("nombre", "organizacion__nombre")  # Para autocomplete
    autocomplete_fields = ("organizacion", "theme")
    list_editable = ("activa",)
    prepopulated_fields = {"slug": ("nombre",)}
    fieldsets = (
        ("Información Básica", {
            "fields": ("organizacion", "nombre", "slug", "direccion")
        }),
        ("Configuración Visual", {
            "fields": ("logo", "fondo", "theme")
        }),
        ("Estado", {
            "fields": ("activa",)
        }),
    )


class AsignacionTrabajadorInline(admin.TabularInline):
    model = AsignacionTrabajador
    extra = 0
    fields = ("trabajador", "sede", "porcentaje_tiempo", "fecha_inicio", "fecha_fin", "activa")
    autocomplete_fields = ("trabajador", "sede")


@admin.register(RelacionServicio)
class RelacionServicioAdmin(ImportExportModelAdmin):
    list_display = ("empresa_servicio", "organizacion_cliente", "fecha_inicio", "fecha_fin", "activo")
    list_filter = ("empresa_servicio", "organizacion_cliente", "activo", "fecha_inicio")
    search_fields = ("empresa_servicio__nombre", "organizacion_cliente__nombre")
    list_editable = ("activo",)
    readonly_fields = ("fecha_creacion", "fecha_actualizacion")
    filter_horizontal = ("sedes_permitidas",)
    autocomplete_fields = ("empresa_servicio", "organizacion_cliente")
    fieldsets = (
        ("Partes de la Relación", {
            "fields": ("empresa_servicio", "organizacion_cliente")
        }),
        ("Configuración", {
            "fields": ("sedes_permitidas",)
        }),
        ("Vigencia", {
            "fields": ("fecha_inicio", "fecha_fin", "activo")
        }),
        ("Metadatos", {
            "fields": ("fecha_creacion", "fecha_actualizacion")
        }),
    )
    inlines = [AsignacionTrabajadorInline]
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "empresa_servicio":
            # Solo empresas de servicio
            kwargs["queryset"] = db_field.related_model.objects.filter(
                tipo_organizacion__es_prestador_servicio=True, activa=True
            )
        elif db_field.name == "organizacion_cliente":
            # Solo organizaciones que NO son empresas de servicio
            kwargs["queryset"] = db_field.related_model.objects.filter(
                tipo_organizacion__es_prestador_servicio=False, activa=True
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(AsignacionTrabajador)
class AsignacionTrabajadorAdmin(ImportExportModelAdmin):
    list_display = ("trabajador", "organizacion", "get_relacion_servicio", "sede", "porcentaje_tiempo", "activa", "fecha_inicio", "fecha_fin")
    list_filter = ("organizacion", "relacion_servicio", "sede", "activa", "es_permanente", "fecha_inicio")
    search_fields = ("trabajador__first_name", "trabajador__last_name", "trabajador__email", "sede__nombre")
    list_editable = ("activa",)
    readonly_fields = ("fecha_creacion", "fecha_actualizacion")
    autocomplete_fields = ("trabajador", "organizacion", "relacion_servicio", "sede")
    fieldsets = (
        ("Asignación", {
            "fields": ("trabajador", "organizacion", "relacion_servicio", "sede")
        }),
        ("Configuración", {
            "fields": ("porcentaje_tiempo", "es_permanente")
        }),
        ("Vigencia", {
            "fields": ("fecha_inicio", "fecha_fin", "activa")
        }),
        ("Metadatos", {
            "fields": ("fecha_creacion", "fecha_actualizacion")
        }),
    )

    def get_relacion_servicio(self, obj):
        if obj.relacion_servicio:
            return f"{obj.relacion_servicio.empresa_servicio.nombre_corto} → {obj.relacion_servicio.organizacion_cliente.nombre_corto}"
        return "Asignación directa"
    get_relacion_servicio.short_description = "Relación de Servicio"
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "sede":
            kwargs["queryset"] = db_field.related_model.objects.filter(activa=True)
        elif db_field.name == "organizacion":
            kwargs["queryset"] = db_field.related_model.objects.filter(activa=True)
        elif db_field.name == "relacion_servicio":
            kwargs["queryset"] = db_field.related_model.objects.filter(activo=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


