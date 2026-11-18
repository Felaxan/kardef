import React from 'react'

/** Panelin sol üst köşesindeki çift logolu KAR-DEF marka rozeti */
export const Icon = () => (
  <span className="kd-topbrand">
    <span className="kd-topbrand-seals">
      <img className="kd-icon" src="/brand/kar-def-logo.png" alt="KAR-DEF" />
      <img className="kd-icon kd-icon--av" src="/brand/av-kardep-logo.png" alt="AV-KARDEP" />
    </span>
    <span className="kd-topbrand-text">
      <b>KAR-DEF</b>
      <small>Panel</small>
    </span>
  </span>
)
