import { toast as rtToast } from "react-toastify";

/**
 * Compatible toast helper:
 * - notify("msg") / notify("msg", "error"|"success"|"warning"|"info")
 * - notify.error("msg") / .success / .warning / .info
 */
function notify(message, type) {
  if (type === "error") return rtToast.error(message);
  if (type === "warning") return rtToast.warning(message);
  if (type === "success") return rtToast.success(message);
  if (type === "info") return rtToast.info(message);
  return rtToast(message);
}

notify.success = (m, opts) => rtToast.success(m, opts);
notify.error = (m, opts) => rtToast.error(m, opts);
notify.warning = (m, opts) => rtToast.warning(m, opts);
notify.info = (m, opts) => rtToast.info(m, opts);

export default notify;
export { notify };
