import './App.css';
import logo from './images/bitmovin-logo.png';
import BitmovinPlayer from './bitmovinPlayer';

function App() {
    return (
        <div className='app'>
            <div id='wrapper'>
                <div id='banner'>
                    <div className='logo'><img src={logo}/></div>
                    <div className='title'><h1>React JS - Modular Player </h1></div>
                    <div className='clear'></div>
                </div>
                <div className='container'>
                    <h1>HTML5 Adaptive Streaming Player for MPEG-DASH & HLS</h1>
                    <h2>Your videos play everywhere with low startup delay, no buffering and in highest quality.</h2>
                    <div className='content'>
                        <div id='player-wrapper'>
                            <BitmovinPlayer />
                        </div>
                        <div className='description'>
                            <p>For more information about the bitmovin player, please have a look at our online <a
                                href='//bitmovin.com/support' target='_blank'>Developer Section</a>.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
