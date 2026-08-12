# R8 keep rules for the TWA wrapper.
#
# This app has no business logic of its own — it launches the PWA in Chrome — so
# there is almost nothing to keep. Everything reachable is either declared in
# AndroidManifest.xml (activities, the DelegationService, the FileProvider), which
# R8 keeps automatically, or lives in androidbrowserhelper.
#
# androidbrowserhelper ships no consumer ProGuard rules of its own (there is no
# proguard.txt in its AAR), so anything it reaches by reflection has to be kept
# here. The one such case is the TrustedWebActivityService binding: the platform
# resolves it through the manifest, but R8 full mode strips the no-arg constructor
# of classes it thinks are never instantiated from code.
#
# locationdelegation.PermissionRequestActivity is not listed below: Chrome / the
# TWA host resolves it through PackageManager intent resolution, so the class
# itself is kept by R8's activity rules derived from the manifest. If the
# geolocation permission prompt ever stops working under R8, add:
#   -keep class com.google.androidbrowserhelper.locationdelegation.PermissionRequestActivity { <init>(); }
-keep class com.google.androidbrowserhelper.trusted.DelegationService { <init>(); }
-keep class org.grottocenter.twa.DelegationService { <init>(); }

# Keep the line numbers of crash reports readable in the Play Console. R8 emits the
# mapping file to app/build/outputs/mapping/release/ — upload it if a stack trace
# ever needs deobfuscating.
#
# renamesourcefileattribute replaces the real filename in the DEX with the literal
# string "SourceFile"; retrace resolves it back through the mapping file, so the
# stack traces stay readable while the class-internal names stay out of the APK.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
