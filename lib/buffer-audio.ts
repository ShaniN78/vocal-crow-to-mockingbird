/**
 * BuffAudio.js - http://github.com/eipark/buffaudio
 * A wrapper around the HTML5 Web Audio API to easily play, pause,
 * and skip around an AudioBuffer.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
 * https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Ernie Park
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

export type CallBackType = CustomEvent<{ isSeeking: boolean }>;

export class BufferedAudio {
    private _isSeeking: boolean = false;
    private _audioContext: AudioContext;
    private _buffer: AudioBuffer;
    private _source: AudioBufferSourceNode;
    private _playbackTime: number;
    private _startTimestamp: number;
    private _isPlaying: boolean;
    private _bufferDuration: number;

    constructor(audioContext: AudioContext, buffer: AudioBuffer) {
      this._audioContext = audioContext;
      this._buffer = buffer;
      this._source = this._audioContext.createBufferSource();
      this._source.buffer = this._buffer;
      this._source.connect(this._audioContext.destination);
      this._playbackTime = 0;
      this._startTimestamp = 0;
      this._isPlaying = false;
      this._bufferDuration = 0;
    }

    public play() {
        console.log("Play");
        if (this._isPlaying) return;
        this._source.start(0, this._playbackTime);
        this._startTimestamp = Date.now();
        this._isPlaying = true;
    }
  
      // Seek to a specific playbackTime (seconds) in the audio buffer. Do not change
      // playback state.
      public seek(playbackTime: number) {
        if (playbackTime === undefined) return;
        if (playbackTime > this._buffer.duration) {
          console.log("[ERROR] Seek time is greater than duration of audio buffer.");
          return;
        }
  
        if (this._isPlaying) {
          this.stop(true, true); // Stop any existing playback if there is any
          this._playbackTime = playbackTime;
          this.play(); // Resume playback at new time
        } else {
          this._playbackTime = playbackTime;
        }
      }
  
      // Pause playback, keep track of where playback stopped
      public pause() {
        this.stop(true, false);
      }
  
      // Stops or pauses playback and sets playbackTime accordingly
      public stop(pause: boolean = false, isSeeking: boolean = false) {
        console.log("Stop");
        if (!this._isPlaying) return;
        this._isPlaying = false; // Set to flag to endOfPlayback callback that this was set manually
        this._isSeeking = isSeeking;
        try {
          this._source.stop(0);
        } catch (e) {
          // Source might already be stopped
        }
        // If paused, calculate time where we stopped. Otherwise go back to beginning of playback (0).
        this._playbackTime = pause ? (Date.now() - this._startTimestamp)/1000 + this._playbackTime : 0;
        // Reinitialize the source node after stopping (can only be started once)
        this.init();
      }
  
      // Callback for any time playback stops/pauses
      public endOfPlayback(endEvent: Event) {
        console.log("end of playback");
  
        // If playback stopped because end of buffer was reached
        if (this._isPlaying) this._playbackTime = 0;
        this._isPlaying = false;
        // Reinitialize the source node after playback ends (can only be started once)
        this.init();
      }
  
      private _onEndedCallback: ((event: CallBackType) => void) | null = null;

      public init() {
        // Stop current playback if playing, but don't reinitialize (to avoid recursion)
        if (this._isPlaying) {
          this._isPlaying = false;
          try {
            this._source.stop(0);
          } catch (e) {
            // Source might already be stopped
          }
        }
        
        // Create new source node (old one can only be started once)
        this._source = this._audioContext.createBufferSource();
        this._source.buffer = this._buffer;
        this._source.connect(this._audioContext.destination);
        this._source.onended = (event: Event) => {
          this.endOfPlayback(event);
          if (this._onEndedCallback) {
            this._onEndedCallback({ detail: { isSeeking: false } } as CallBackType);
          }
        };
        this._bufferDuration = this._buffer.duration;
      }

      // Get current playback time
      public getCurrentTime(): number {
        if (this._isPlaying) {
          return (Date.now() - this._startTimestamp) / 1000 + this._playbackTime;
        }
        return this._playbackTime;
      }

      // Get playing state
      public getIsPlaying(): boolean {
        return this._isPlaying;
      }

      // Get duration
      public getDuration(): number {
        return this._buffer.duration;
      }

      // Set custom end of playback callback
      public setOnEnded(callback: (event: CallBackType) => void) {
        this._onEndedCallback = callback;
        if (this._source) {
          this._source.onended = (event: Event) => {
            this.endOfPlayback(event);
            if (this._onEndedCallback) {
              this._onEndedCallback({ detail: { isSeeking: this._isSeeking } } as CallBackType);
            }
          };
        }
      }

    }