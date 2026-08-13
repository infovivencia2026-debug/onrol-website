; Custom NSIS installer script for ONROL Desktop
; Referenced by electron-builder config (build.nsis.include in package.json).
; Add custom install/uninstall hooks here. Safe no-op defaults below.

!macro customInstall
  ; Place custom install-time actions here (e.g. registry keys, file associations).
!macroend

!macro customUnInstall
  ; Place custom uninstall-time cleanup here.
!macroend
