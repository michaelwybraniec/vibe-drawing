#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeHaptics, "NativeHaptics",
  CAP_PLUGIN_METHOD(start, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(update, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(stop, CAPPluginReturnPromise);
)
