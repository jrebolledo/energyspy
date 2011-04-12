from energyspy.viewer.models import *
from django.contrib import admin

admin.site.register(Clients)
admin.site.register(Typeofdevices)

class DevicesAdmin(admin.ModelAdmin):
    def section(obj):
        return obj.subsubsection.subsection.section.name 
    list_display = ('name', section,'status','coordinator','typeofdevice','slots','virtual')
    list_filter = ('subsubsection','subsection','status','typeofdevice','name','coordinator')

admin.site.register(Devices, DevicesAdmin)
admin.site.register(Coordinators)
admin.site.register(Events)
admin.site.register(Categories)
admin.site.register(Measurements)
admin.site.register(Control)
admin.site.register(Alarms)
admin.site.register(Boards)


admin.site.register(Dicts)
admin.site.register(KeyVal)


admin.site.register(Driver_Dicts)
admin.site.register(KeyVal_Driver)


admin.site.register(Buildings)
admin.site.register(Sections)
admin.site.register(SubSections)
admin.site.register(SubSubSections)

admin.site.register(PushService)