from rest_framework import serializers
from acceso.models import TemplateAccess, AccessPermission

class TemplateAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateAccess
        fields = ['id', 'name']


class AccessPermissionSerializer(serializers.ModelSerializer):
    templates = TemplateAccessSerializer(many=True)

    class Meta:
        model = AccessPermission
        fields = ['group', 'empresa', 'templates']
