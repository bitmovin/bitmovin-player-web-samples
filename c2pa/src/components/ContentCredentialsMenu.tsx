import { type C2paPlaybackState } from '../c2pa/C2paValidator';
import './ContentCredentialsMenu.css';

interface ContentCredentialsMenuProps {
  state: C2paPlaybackState | undefined;
  onClose: () => void;
}

export function ContentCredentialsMenu({ state, onClose }: ContentCredentialsMenuProps) {
  const activeManifest = state?.manifest;

  if (!state || !activeManifest) return null;

  // Extract relevant data
  const issuer = activeManifest.signatureInfo.issuer || 'Unknown';
  const issueDate = activeManifest.signatureInfo.certNotBefore
    ? new Date(activeManifest.signatureInfo.certNotBefore).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  // Extract app/device used from claimGenerator
  const appUsed = activeManifest.claimGenerator
    ? activeManifest.claimGenerator.split(' ')[0].replace(/_/g, ' ')
    : 'Unknown';

  // Extract author/name from CreativeWork assertion
  const creativeWorkAssertion = activeManifest.assertions?.find(a => a.label === 'stds.schema-org.CreativeWork');
  let authorName = '';
  let websiteUrl = '';
  let socialMediaLabel = '';
  let socialMediaUrl = '';

  if (creativeWorkAssertion && typeof creativeWorkAssertion.data === 'object' && creativeWorkAssertion.data) {
    const data = creativeWorkAssertion.data as {
      author?: Array<{ name?: string; '@id'?: string; '@type'?: string }>;
      url?: string;
    };

    if (data.author && data.author.length > 0) {
      authorName = data.author[0].name || '';
      // Check for social media link
      const socialAuthor = data.author.find(a => a['@id']);
      if (socialAuthor?.['@id']) {
        socialMediaUrl = socialAuthor['@id'];
        if (socialMediaUrl.includes('linkedin.com')) {
          socialMediaLabel = 'LinkedIn';
        } else if (socialMediaUrl.includes('twitter.com') || socialMediaUrl.includes('x.com')) {
          socialMediaLabel = 'Twitter';
        } else {
          socialMediaLabel = 'Social Media';
        }
      }
    }
    websiteUrl = data.url || '';
  }

  // Extract GPS location from EXIF
  const exifAssertion = activeManifest.assertions?.find(a => a.label === 'stds.exif');
  let location = '';

  if (exifAssertion && typeof exifAssertion.data === 'object' && exifAssertion.data) {
    const data = exifAssertion.data as {
      'EXIF:GPSLatitude'?: string;
      'EXIF:GPSLongitude'?: string;
    };

    if (data['EXIF:GPSLatitude'] && data['EXIF:GPSLongitude']) {
      location = `${data['EXIF:GPSLatitude']},${data['EXIF:GPSLongitude']}`;
    }
  }

  // Extract performed actions from the c2pa.actions assertion (v1 or v2)
  const actionsAssertion = activeManifest.assertions.find(a => a.label.startsWith('c2pa.actions'));
  let actions: string[] = [];

  if (actionsAssertion && typeof actionsAssertion.data === 'object' && actionsAssertion.data) {
    const data = actionsAssertion.data as { actions?: Array<{ action?: string }> };
    actions = (data.actions ?? [])
      .map(a => a.action)
      .filter((a): a is string => !!a)
      .map(a => {
        const name = a.replace(/^c2pa\./, '').replace(/_/g, ' ');
        return name.charAt(0).toUpperCase() + name.slice(1);
      });
  }

  // Get validation status
  const validationStatus = state.isValid ? 'Passed' : 'Failed';

  // Describe the sequence continuity result for Live VSI streams
  let sequenceInfo = '';
  if (state.sequenceNumber !== undefined && state.sequenceResult) {
    const reason = state.sequenceResult.reason;
    if (reason === 'gap_detected') {
      sequenceInfo = `#${state.sequenceNumber} (gap detected: missing #${state.sequenceResult.missingFrom}–#${state.sequenceResult.missingTo})`;
    } else if (reason === 'valid') {
      sequenceInfo = `#${state.sequenceNumber}`;
    } else {
      sequenceInfo = `#${state.sequenceNumber} (${reason.replace(/_/g, ' ')})`;
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="cc-menu-overlay" onClick={handleOverlayClick}>
      <div className="cc-menu-card">
        <button className="cc-menu-close" onClick={onClose}>
          ×
        </button>

        <div className="cc-menu-header">
          <h2>Content Credentials</h2>
          <p className="cc-menu-issuer">
            Issued by {issuer} on {issueDate}
          </p>
        </div>

        <div className="cc-menu-content">
          <div className="cc-menu-info">
            <div className="cc-menu-info-item">
              <strong>App or device used</strong> {appUsed}
            </div>

            {authorName && (
              <div className="cc-menu-info-item">
                <strong>Name</strong> {authorName}
              </div>
            )}

            {location && (
              <div className="cc-menu-info-item">
                <strong>Location</strong>{' '}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${location}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-menu-link"
                >
                  {location}
                </a>
              </div>
            )}

            {websiteUrl && (
              <div className="cc-menu-info-item">
                <strong>Website</strong>{' '}
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="cc-menu-link">
                  {websiteUrl}
                </a>
              </div>
            )}

            {socialMediaLabel && (
              <div className="cc-menu-info-item">
                <strong>Social Media</strong>{' '}
                <a href={socialMediaUrl} target="_blank" rel="noopener noreferrer" className="cc-menu-link">
                  {socialMediaLabel}
                </a>
              </div>
            )}

            {actions.length > 0 && (
              <div className="cc-menu-info-item">
                <strong>Actions</strong> {actions.join(', ')}
              </div>
            )}

            <div className="cc-menu-info-item">
              <strong>Validation Method</strong> {state.mode}
            </div>

            {sequenceInfo && (
              <div className="cc-menu-info-item">
                <strong>Segment Sequence</strong> {sequenceInfo}
              </div>
            )}

            <div className="cc-menu-info-item">
              <strong>Current Validation Status</strong> {validationStatus}
            </div>

            {state.errorCodes.length > 0 && (
              <div className="cc-menu-info-item">
                <strong>Validation Errors</strong> {state.errorCodes.join(', ')}
              </div>
            )}
          </div>

          <button className="cc-menu-inspect-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
