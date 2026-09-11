export function setupAzPhoneInput(input) {
    if (!input) return;

    function extractDigits(raw) {
        let digits = raw.replace(/\D/g, "");
        if (digits.startsWith("994")) digits = digits.slice(3);
        return digits.slice(0, 9);
    }

    function format(digits) {
        let out = "+994";
        if (digits.length > 0) out += " " + digits.slice(0, 2);
        if (digits.length > 2) out += " " + digits.slice(2, 5);
        if (digits.length > 5) out += " " + digits.slice(5, 7);
        if (digits.length > 7) out += " " + digits.slice(7, 9);
        return out;
    }

    function refresh() {
        input.value = format(extractDigits(input.value));
    }

    if (!input.value.trim()) {
        input.value = "+994";
    } else {
        refresh();
    }

    input.addEventListener("input", refresh);
    input.addEventListener("blur", refresh);
    input.addEventListener("focus", () => {
        if (!input.value.trim()) input.value = "+994";
    });
}
