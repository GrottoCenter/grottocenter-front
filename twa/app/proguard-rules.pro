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
-keep class com.google.androidbrowserhelper.trusted.DelegationService { <init>(); }
-keep class org.grottocenter.twa.DelegationService { <init>(); }

# Keep the line numbers of crash reports readable in the Play Console. R8 emits the
# mapping file to app/build/outputs/mapping/release/ — upload it if a stack trace
# ever needs deobfuscating.
-keepattributes SourceFile,LineNumberTable
