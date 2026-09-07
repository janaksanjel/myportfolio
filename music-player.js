// Music Player with Free Music API
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.currentTrackIndex = 0;
        this.tracks = [];
        this.isPlaying = false;
        this.isShuffled = false;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.playBtn = document.getElementById('play-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.loadBtn = document.getElementById('load-music');
        this.trackTitle = document.getElementById('track-title');
        this.trackArtist = document.getElementById('track-artist');
        this.currentTime = document.getElementById('current-time');
        this.duration = document.getElementById('duration');
        this.progress = document.getElementById('progress');
        this.volumeSlider = document.getElementById('volume-slider');
        this.trackList = document.getElementById('track-list');
    }

    bindEvents() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.loadBtn.addEventListener('click', () => this.loadMusic());
        
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        
        this.volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });

        // Progress bar click
        document.querySelector('.progress-bar').addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });
    }

    async loadMusic() {
        this.loadBtn.textContent = 'Loading...';
        this.loadBtn.disabled = true;

        // Load local songs from song folder
        this.tracks = [
            {
                id: 1,
                title: "One Piece OST Overtaken",
                artist: "One Piece",
                url: "./song/One Piece OST Overtaken.mp3",
                duration: 180
            },
            {
                id: 2,
                title: "Bilionera",
                artist: "Otilia",
                url: "./song/Otilia - Bilionera (official video).mp3",
                duration: 210
            },
            {
                id: 3,
                title: "Labon Ko (Slowed + Reverb)",
                artist: "Artist",
                url: "./song/Labon Ko (Slowed + Reverb).mp3",
                duration: 240
            }
        ];
        
        this.displayPlaylist();
        this.loadTrack(0);

        this.loadBtn.textContent = 'Music Loaded';
        this.loadBtn.disabled = false;
    }

    loadSampleTracks() {
        // Load local songs
        this.tracks = [
            {
                id: 1,
                title: "One Piece OST Overtaken",
                artist: "One Piece",
                url: "./song/One Piece OST Overtaken.mp3",
                duration: 180
            },
            {
                id: 2,
                title: "Bilionera",
                artist: "Otilia",
                url: "./song/Otilia - Bilionera (official video).mp3",
                duration: 210
            },
            {
                id: 3,
                title: "Labon Ko (Slowed + Reverb)",
                artist: "Artist",
                url: "./song/Labon Ko (Slowed + Reverb).mp3",
                duration: 240
            }
        ];
        
        this.displayPlaylist();
        this.loadTrack(0);
    }

    createAudioTone(frequency, duration) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = audioContext.sampleRate;
        const numSamples = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < numSamples; i++) {
            channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
        }
        
        // Convert to WAV blob URL
        const wavBlob = this.bufferToWav(buffer);
        return URL.createObjectURL(wavBlob);
    }

    bufferToWav(buffer) {
        const length = buffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        const channelData = buffer.getChannelData(0);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Convert samples
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    displayPlaylist() {
        this.trackList.innerHTML = '';
        
        this.tracks.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'track-item';
            trackElement.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <div class="track-name">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">${this.formatTime(track.duration)}</div>
            `;
            
            trackElement.addEventListener('click', () => {
                this.currentTrackIndex = index;
                this.loadTrack(index);
                this.play();
            });
            
            this.trackList.appendChild(trackElement);
        });
    }

    loadTrack(index) {
        if (this.tracks.length === 0) return;
        
        const track = this.tracks[index];
        this.audio.src = track.url;
        this.trackTitle.textContent = track.title;
        this.trackArtist.textContent = track.artist;
        
        // Update active track in playlist
        document.querySelectorAll('.track-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        // Update floating player if visible
        const floatingPlayer = document.getElementById('floating-player');
        if (floatingPlayer && floatingPlayer.style.display !== 'none') {
            document.getElementById('floating-title').textContent = track.title;
            document.getElementById('floating-artist').textContent = track.artist;
        }
    }

    togglePlay() {
        if (this.tracks.length === 0) {
            this.loadMusic();
            setTimeout(() => {
                if (this.tracks.length > 0) {
                    this.play();
                }
            }, 500);
            return;
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.showFloatingPlayer();
        } catch (error) {
            console.error('Error playing audio:', error);
            if (this.tracks.length === 0) {
                this.loadMusic();
            }
        }
    }

    showFloatingPlayer() {
        let floatingPlayer = document.getElementById('floating-player');
        if (!floatingPlayer) {
            floatingPlayer = document.createElement('div');
            floatingPlayer.id = 'floating-player';
            floatingPlayer.innerHTML = `
                <div class="floating-content">
                    <div class="floating-info">
                        <div class="floating-title" id="floating-title">No Track</div>
                        <div class="floating-artist" id="floating-artist">Unknown</div>
                    </div>
                    <div class="floating-controls">
                        <button id="floating-prev"><i class="fas fa-step-backward"></i></button>
                        <button id="floating-play"><i class="fas fa-play"></i></button>
                        <button id="floating-next"><i class="fas fa-step-forward"></i></button>
                        <button id="floating-close"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            `;
            document.body.appendChild(floatingPlayer);
            
            // Bind floating player events
            document.getElementById('floating-play').addEventListener('click', () => this.togglePlay());
            document.getElementById('floating-prev').addEventListener('click', () => this.previousTrack());
            document.getElementById('floating-next').addEventListener('click', () => this.nextTrack());
            document.getElementById('floating-close').addEventListener('click', () => {
                floatingPlayer.style.display = 'none';
                this.pause();
            });
        }
        
        // Update floating player info
        if (this.tracks.length > 0) {
            const track = this.tracks[this.currentTrackIndex];
            document.getElementById('floating-title').textContent = track.title;
            document.getElementById('floating-artist').textContent = track.artist;
        }
        
        floatingPlayer.style.display = 'block';
        this.updateFloatingPlayButton();
    }

    updateFloatingPlayButton() {
        const floatingPlayBtn = document.getElementById('floating-play');
        if (floatingPlayBtn) {
            floatingPlayBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.updateFloatingPlayButton();
    }

    previousTrack() {
        if (this.tracks.length === 0) return;
        
        this.currentTrackIndex = this.currentTrackIndex > 0 ? this.currentTrackIndex - 1 : this.tracks.length - 1;
        this.loadTrack(this.currentTrackIndex);
        if (this.isPlaying) this.play();
    }

    nextTrack() {
        if (this.tracks.length === 0) return;
        
        if (this.isShuffled) {
            this.currentTrackIndex = Math.floor(Math.random() * this.tracks.length);
        } else {
            this.currentTrackIndex = this.currentTrackIndex < this.tracks.length - 1 ? this.currentTrackIndex + 1 : 0;
        }
        
        this.loadTrack(this.currentTrackIndex);
        if (this.isPlaying) this.play();
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active', this.isShuffled);
    }

    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progress.style.width = percent + '%';
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    updateDuration() {
        this.duration.textContent = this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize music player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();
    
    // Auto-load tracks when music window opens
    const musicWindow = document.getElementById('music-window');
    if (musicWindow) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (musicWindow.style.display !== 'none' && window.musicPlayer.tracks.length === 0) {
                        window.musicPlayer.loadMusic();
                    }
                }
            });
        });
        observer.observe(musicWindow, { attributes: true });
    }
});