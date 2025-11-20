# C2PA Content Credentials for Bitmovin Web Player

A demo application showcasing Content Credentials (C2PA) validation integrated with the Bitmovin Web Player. This project demonstrates how to validate and display content authenticity information for video streams using the C2PA standard.

The application uses the [C2PA JavaScript SDK](https://github.com/contentauth/c2pa-js) to perform validation and displays the results in a user-friendly interface.

> **Disclaimer**: This is a sample application developed during a hackathon. As such, it may contain bugs and shortcomings. It is provided as-is for demonstration purposes and should not be used in production environments without thorough testing and review.

## Features

- **C2PA Validation**: Validates video content against C2PA (Coalition for Content Provenance and Authenticity) standards
- **Real-time Segment Validation**: Validates individual video segments during playback for DASH/HLS streams
- **Visual Indicators**: Displays validation status with clear icons (Valid, Invalid, No Credentials)
- **Content Credentials Menu**: Interactive menu showing detailed manifest information

## Try it

You can try the demo application at: https://demo.bitmovin.com/public/c2pa/

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`).

### Build

```bash
npm run build
```

## How It Works

### C2PA Validation

The `C2paValidator` class handles all C2PA-related functionality:

1. **Initialization**: Creates a C2PA SDK instance using WebAssembly
2. **HTTP Response Preprocessing**: Intercepts video segment downloads to extract C2PA data
3. **Segment Validation**: Validates each segment's C2PA manifest during playback
4. **Manifest Caching**: Stores validated manifests to avoid redundant processing

### Player Integration

The Bitmovin Player is configured with:

- Custom HTTP response preprocessing for C2PA validation
- Segment playback event handlers to trigger validation
- Parallel segment loading disabled to ensure that the init segment is available for validation of data segments

## Resources

- [C2PA JavaScript SDK](https://github.com/contentauth/c2pa-js) - Official C2PA SDK used in this project
- [C2PA Specification](https://c2pa.org/specifications/)
- [Bitmovin Player Documentation](https://developer.bitmovin.com/playback/docs/getting-started)
- [Content Authenticity Initiative](https://contentauthenticity.org/)
- [Content Credentials Player Demo](https://contentcredentials-player.netlify.app/)
