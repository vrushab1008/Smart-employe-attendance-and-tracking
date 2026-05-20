import React, { useState, useEffect } from 'react';
import { Camera, MapPin, KeyRound, Check, AlertCircle, Scan, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { HQ_COORDINATES } from '../db';

export default function Verification({ actionType, employee, onSuccess, onCancel }) {
  const [step, setStep] = useState(1); // 1: Face, 2: GPS, 3: PIN
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceScanned, setFaceScanned] = useState(false);
  const [gpsLocating, setGpsLocating] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsDistance, setGpsDistance] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinVerifying, setPinVerifying] = useState(false);

  // 1. Face Scan Simulation
  const startFaceScan = () => {
    setFaceScanning(true);
    setFaceScanned(false);
    setTimeout(() => {
      setFaceScanning(false);
      setFaceScanned(true);
    }, 2500); // 2.5 second scan simulation
  };

  // 2. GPS Location Verification
  const startGpsCheck = () => {
    setGpsLocating(true);
    setGpsVerified(false);
    
    // Attempt real HTML5 Geolocation, fallback to mock if fails or denied
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setGpsCoords({ latitude: lat, longitude: lon });
          
          // Calculate distance to HQ coordinates (in meters)
          const dist = calculateDistance(
            lat, lon, 
            HQ_COORDINATES.latitude, HQ_COORDINATES.longitude
          );
          setGpsDistance(Math.round(dist));
          
          setTimeout(() => {
            setGpsLocating(false);
            setGpsVerified(true);
          }, 1500);
        },
        (error) => {
          // Fallback to mock coords
          mockGpsSearch();
        },
        { timeout: 5000 }
      );
    } else {
      mockGpsSearch();
    }
  };

  const mockGpsSearch = () => {
    setTimeout(() => {
      // Mock inside office coordinates (slightly offset from HQ)
      const lat = HQ_COORDINATES.latitude + (Math.random() - 0.5) * 0.0005;
      const lon = HQ_COORDINATES.longitude + (Math.random() - 0.5) * 0.0005;
      setGpsCoords({ latitude: lat, longitude: lon });
      
      const dist = calculateDistance(
        lat, lon, 
        HQ_COORDINATES.latitude, HQ_COORDINATES.longitude
      );
      setGpsDistance(Math.round(dist));
      setGpsLocating(false);
      setGpsVerified(true);
    }, 2000);
  };

  // Haversine distance formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
  };

  // Trigger GPS scan when entering step 2
  useEffect(() => {
    if (step === 2) {
      startGpsCheck();
    }
  }, [step]);

  // 3. PIN Pad Entries
  const handlePinPress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError(false);
      
      // Auto submit when 4 digits reached
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const verifyPin = (typedPin) => {
    setPinVerifying(true);
    setTimeout(() => {
      setPinVerifying(false);
      if (typedPin === '1234') {
        // Complete verification
        onSuccess({
          verification: ['Face ID', 'Geofence', 'PIN'],
          location: gpsDistance <= HQ_COORDINATES.radiusMeters ? 'HQ Office' : 'Remote',
          device: getBrowserDeviceInfo()
        });
      } else {
        setPinError(true);
        setPin('');
      }
    }, 1200);
  };

  const getBrowserDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") > -1) return "Windows PC - Chrome";
    if (userAgent.indexOf("Safari") > -1) return "Apple Device - Safari";
    if (userAgent.indexOf("Firefox") > -1) return "Linux PC - Firefox";
    if (userAgent.indexOf("Edge") > -1) return "Windows PC - Edge";
    return "Office Terminal";
  };

  return (
    <div className="verification-overlay">
      <div className="verification-modal glass-container">
        
        {/* Verification Progress Stepper */}
        <div className="stepper-header">
          <div className="stepper-step-indicator">
            <span className="stepper-title">{actionType} Verification</span>
            <span className="stepper-subtitle">MFA Smart Security Authorization</span>
          </div>
          <div className="stepper-dots">
            <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              {step > 1 ? <Check size={10} /> : '1'}
            </div>
            <div className="step-connector"></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              {step > 2 ? <Check size={10} /> : '2'}
            </div>
            <div className="step-connector"></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''} ${step === 3 && pinVerifying ? 'loading' : ''}`}>
              {step > 3 ? <Check size={10} /> : '3'}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="stepper-content">
          
          {/* STEP 1: FACE RECOGNITION */}
          {step === 1 && (
            <div className="verification-step-panel">
              <div className="step-instructions">
                <Camera size={20} className="step-icon-purple" />
                <div>
                  <h4>Facial Authentication</h4>
                  <p>Align your face to the camera for biometric scan comparison.</p>
                </div>
              </div>

              <div className="biometric-scanner-viewport">
                {/* Simulated Webcam stream */}
                <div className="webcam-viewport-bg">
                  {faceScanned ? (
                    <div className="scanned-image-wrapper">
                      {/* Show scanned face */}
                      <div className="scanned-avatar-mask" style={{ backgroundColor: employee.color }}>
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="scan-badge success">
                        <ShieldCheck size={14} />
                        <span>Match Approved: 99.8%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="scanner-active-view">
                      <div className="face-oval-guide"></div>
                      {faceScanning && <div className="laser-scanner-line"></div>}
                      <Scan size={48} className={`scanner-target ${faceScanning ? 'scanning' : ''}`} />
                      
                      {faceScanning && (
                        <div className="scanning-overlay-text">
                          <RefreshCw size={14} className="spin" />
                          <span>Mapping Biometric Points...</span>
                        </div>
                      )}
                      
                      {!faceScanning && (
                        <button className="btn-secondary start-scan-btn" onClick={startFaceScan}>
                          Scan Biometrics
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="step-actions">
                <button className="btn-text" onClick={onCancel}>Cancel</button>
                <button 
                  className="btn-primary" 
                  disabled={!faceScanned}
                  onClick={() => setStep(2)}
                >
                  <span>Verify Geofence</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GEOFENCE LOCATION */}
          {step === 2 && (
            <div className="verification-step-panel">
              <div className="step-instructions">
                <MapPin size={20} className="step-icon-green" />
                <div>
                  <h4>Geofence Verification</h4>
                  <p>Validating device GPS location against office boundary (Radius: 200m).</p>
                </div>
              </div>

              <div className="geofence-status-view">
                <div className="map-simulation-grid">
                  <div className="gps-hq-marker">
                    <span className="hq-tag">HQ</span>
                  </div>
                  {gpsVerified && (
                    <div 
                      className={`gps-user-marker ${gpsDistance <= HQ_COORDINATES.radiusMeters ? 'inside' : 'outside'}`}
                      style={{ 
                        transform: `translate(${Math.min(gpsDistance / 6, 60)}px, ${Math.min(-gpsDistance / 8, -40)}px)` 
                      }}
                    >
                      <span className="user-dot"></span>
                    </div>
                  )}
                  {gpsLocating && <div className="radar-ping-ring"></div>}
                </div>

                <div className="geofence-stats-box">
                  {gpsLocating && (
                    <div className="gps-searching-text">
                      <RefreshCw size={16} className="spin" />
                      <span>Ping GPS satellites... acquiring lock</span>
                    </div>
                  )}
                  {gpsVerified && (
                    <div className="gps-details-reveal">
                      <div className="gps-stat-row">
                        <span className="label">HQ Coordinates:</span>
                        <span className="val">{HQ_COORDINATES.latitude.toFixed(5)}, {HQ_COORDINATES.longitude.toFixed(5)}</span>
                      </div>
                      <div className="gps-stat-row">
                        <span className="label">Your Coordinates:</span>
                        <span className="val">{gpsCoords?.latitude.toFixed(5)}, {gpsCoords?.longitude.toFixed(5)}</span>
                      </div>
                      <div className="gps-stat-row">
                        <span className="label">Distance to HQ:</span>
                        <span className="val font-highlight">{gpsDistance} meters</span>
                      </div>
                      
                      <div className={`geofence-status-pill ${gpsDistance <= HQ_COORDINATES.radiusMeters ? 'inside' : 'outside'}`}>
                        {gpsDistance <= HQ_COORDINATES.radiusMeters ? (
                          <>
                            <ShieldCheck size={14} />
                            <span>Authorized (Within HQ boundary)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} />
                            <span>Authorized (Remote Mode Active)</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="step-actions">
                <button className="btn-text" onClick={() => setStep(1)}>Back</button>
                <button 
                  className="btn-primary" 
                  disabled={!gpsVerified}
                  onClick={() => setStep(3)}
                >
                  <span>Verify Security PIN</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SECURITY PIN */}
          {step === 3 && (
            <div className="verification-step-panel">
              <div className="step-instructions">
                <KeyRound size={20} className="step-icon-amber" />
                <div>
                  <h4>Secure Keypad Entry</h4>
                  <p>Confirm authorization. Enter security PIN to complete {actionType.toLowerCase()}.</p>
                </div>
              </div>

              <div className="pin-keypad-panel">
                <div className="pin-indicators-row">
                  {[0, 1, 2, 3].map((idx) => (
                    <div 
                      key={idx} 
                      className={`pin-bullet ${pin.length > idx ? 'filled' : ''} ${pinError ? 'error' : ''}`}
                    ></div>
                  ))}
                </div>

                <div className="pin-info-helper">
                  {pinError ? (
                    <span className="pin-error-text">Incorrect PIN. Please try again.</span>
                  ) : pinVerifying ? (
                    <span className="pin-verifying-text">Validating credentials...</span>
                  ) : (
                    <span className="pin-tip-text">Simulator Tip: Enter <strong>1234</strong></span>
                  )}
                </div>

                <div className="numpad-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button 
                      key={num} 
                      disabled={pinVerifying}
                      className="numpad-btn" 
                      onClick={() => handlePinPress(String(num))}
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    disabled={pinVerifying}
                    className="numpad-btn text-btn" 
                    onClick={() => setPin('')}
                  >
                    Clear
                  </button>
                  <button 
                    disabled={pinVerifying}
                    className="numpad-btn" 
                    onClick={() => handlePinPress('0')}
                  >
                    0
                  </button>
                  <button 
                    disabled={pinVerifying}
                    className="numpad-btn text-btn" 
                    onClick={handlePinDelete}
                  >
                    Del
                  </button>
                </div>
              </div>

              <div className="step-actions">
                <button className="btn-text" onClick={() => setStep(2)}>Back</button>
                <div className="spacer-btn"></div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
