import Toast from "react-native-toast-message";

type ToastMessage = {
  title: string;
  message?: string;
};

function showToast(type: "success" | "error" | "info", toast: ToastMessage) {
  Toast.show({
    type,
    text1: toast.title,
    text2: toast.message,
  });
}

export function showSuccessToast(title: string, message?: string) {
  showToast("success", { title, message });
}

export function showErrorToast(title: string, message?: string) {
  showToast("error", { title, message });
}

export function showInfoToast(title: string, message?: string) {
  showToast("info", { title, message });
}
