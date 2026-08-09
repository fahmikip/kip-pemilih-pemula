/** Public health endpoint used by the initial web shell. */
function getPublicBootstrap() {
  try {
    const status = getSetupStatus();
    return apiSuccess_({appName:APP.NAME, version:APP.VERSION, setup:status.data});
  } catch (error) {
    console.error(error);
    return apiError_('Aplikasi belum siap. Hubungi administrator.', 'APP_NOT_READY');
  }
}
