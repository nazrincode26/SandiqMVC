/** Views/Cart/_CheckoutSteps.cshtml */
export const CHECKOUT_STEPS = ["Sifarişi yoxla", "Ödəniş et", "Təsdiq"];

export function stepClass(stepNum: number, current: number) {
  return stepNum === current ? "checkout-step--active" : stepNum < current ? "checkout-step--done" : "";
}

export default function CheckoutSteps({ current }: { current: number }) {
  return (
    <div className="checkout-steps">
      {CHECKOUT_STEPS.map((label, i) => {
        const stepNum = i + 1;
        return (
          <div key={stepNum} className={`checkout-step ${stepClass(stepNum, current)}`} data-step={stepNum}>
            <span className="checkout-step__num">{stepNum < current ? "✓" : stepNum}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
