function animateTrip(fromFraction, toFraction, duration) {
  return new Promise(resolve => {

    const startTime = performance.now();

    function frame(now) {

      const elapsed = now - startTime;

      let progress = elapsed / duration;

      progress = Math.max(
        0,
        Math.min(1, progress)
      );

      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(
              -2 * progress + 2,
              2
            ) / 2;

      const fraction =
        fromFraction +
        (toFraction - fromFraction) * eased;

      /*
       * ESTA ÚNICA LLAMADA mueve:
       * - coche/avión
       * - línea negra
       */
      window.TripMap.positionAtRouteFraction(
        fraction
      );

      if (progress < 1) {

        requestAnimationFrame(frame);

      } else {

        /*
         * Forzar el punto final exacto.
         */
        window.TripMap.positionAtRouteFraction(
          toFraction
        );

        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}
