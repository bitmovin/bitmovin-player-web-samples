import { type ManifestStore } from '@contentauth/c2pa-web';
import './ContentCredentialsMenu.css';

interface ContentCredentialsMenuProps {
  manifest: ManifestStore | undefined;
  onClose: () => void;
}

export function ContentCredentialsMenu({ manifest, onClose }: ContentCredentialsMenuProps) {
  if (!manifest) return null;

  const activeManifestLabel = manifest.active_manifest;
  const activeManifest = activeManifestLabel ? manifest.manifests[activeManifestLabel] : undefined;

  if (!activeManifest) return null;

  // Extract relevant data
  const issuer = activeManifest.signature_info?.issuer || 'Unknown';
  const issueDate = activeManifest.signature_info?.time
    ? new Date(activeManifest.signature_info.time).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  // Extract app/device used from claim_generator
  const appUsed = activeManifest.claim_generator
    ? activeManifest.claim_generator.split(' ')[0].replace(/_/g, ' ')
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

  // Get validation status
  const validationStatus =
    manifest.validation_state === 'Valid' || manifest.validation_state === 'Trusted' ? 'Passed' : 'Failed';

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

            <div className="cc-menu-info-item">
              <strong>Current Validation Status</strong> {validationStatus}
            </div>
          </div>

          <button className="cc-menu-inspect-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
