if (document.monetization) {
  document.monetization.addEventListener("monetizationstart", (e) => {
    document.dispatchEvent(
      new CustomEvent("paytrackr_monetizationstart", {
        detail: {
          ...e.detail,
        },
      }),
    );
  });

  document.monetization.addEventListener("monetizationstop", (e) => {
    document.dispatchEvent(
      new CustomEvent("paytrackr_monetizationstop", {
        detail: e.detail,
      }),
    );
  });

  document.monetization.addEventListener("monetizationprogress", (e) => {
    document.dispatchEvent(
      new CustomEvent("paytrackr_monetizationprogress", {
        detail: e.detail,
      }),
    );
  });
}
