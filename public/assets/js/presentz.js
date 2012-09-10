/*
Presentz - A web library to show synchronized video + slides presentations

Copyright (C) 2012 Federico Fissore

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
// Generated by CoffeeScript 1.3.3
(function() {
  var BlipTv, Html5Video, ImgSlide, Presentz, SlideShare, SpeakerDeck, SwfSlide, Video, Vimeo, Youtube, root,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Video = (function() {

    function Video(playStates, pauseStates, finishStates, presentz) {
      this.playStates = playStates;
      this.pauseStates = pauseStates;
      this.finishStates = finishStates;
      this.presentz = presentz;
      this.isInPauseState = true;
    }

    Video.prototype.handleEvent = function(event) {
      var listener, listeners, _i, _len;
      this.isInPlayState = __indexOf.call(this.playStates, event) >= 0;
      this.isInPauseState = __indexOf.call(this.pauseStates, event) >= 0 || !this.isInPlayState;
      this.isInFinishState = __indexOf.call(this.finishStates, event) >= 0;
      if (this.isInPlayState) {
        this.presentz.startTimeChecker();
        listeners = this.presentz.listeners.play;
      } else if (this.isInPauseState || this.isInFinishState) {
        this.presentz.stopTimeChecker();
        if (this.isInPauseState) {
          listeners = this.presentz.listeners.pause;
        } else if (this.isInFinishState) {
          listeners = this.presentz.listeners.finish;
        }
      }
      if (listeners != null) {
        for (_i = 0, _len = listeners.length; _i < _len; _i++) {
          listener = listeners[_i];
          listener();
        }
      }
      if (this.isInFinishState && this.presentz.currentChapterIndex < (this.presentz.howManyChapters - 1)) {
        this.presentz.changeChapter(this.presentz.currentChapterIndex + 1, 0, true);
      }
    };

    return Video;

  })();

  Html5Video = (function() {

    function Html5Video(presentz, videoContainer, width, height) {
      this.presentz = presentz;
      this.videoContainer = videoContainer;
      this.width = width;
      this.height = height;
      this.video = new Video(["play"], ["pause"], ["ended"], this.presentz);
      this.elementId = this.presentz.newElementName();
    }

    Html5Video.prototype.handle = function(video) {
      return true;
    };

    Html5Video.prototype.changeVideo = function(videoData, wouldPlay) {
      var playerOptions, videoHtml,
        _this = this;
      this.wouldPlay = wouldPlay;
      jQuery(this.videoContainer).empty();
      videoHtml = "<video id=\"" + this.elementId + "\" controls preload=\"none\" src=\"" + videoData.url + "\" width=\"100%\" height=\"100%\"></video>";
      jQuery(this.videoContainer).append(videoHtml);
      playerOptions = {
        timerRate: 500,
        success: function(me) {
          _this.onPlayerLoaded(me);
        }
      };
      new MediaElementPlayer("#" + this.elementId, playerOptions);
    };

    Html5Video.prototype.onPlayerLoaded = function(player) {
      var eventHandler,
        _this = this;
      this.player = player;
      eventHandler = function(event) {
        _this.video.handleEvent(event.type);
      };
      player.addEventListener("play", eventHandler, false);
      player.addEventListener("pause", eventHandler, false);
      player.addEventListener("ended", eventHandler, false);
      this.player.load();
      if (this.wouldPlay) {
        this.play();
      }
    };

    Html5Video.prototype.currentTime = function() {
      return this.player.currentTime;
    };

    Html5Video.prototype.skipTo = function(time, wouldPlay) {
      if (wouldPlay == null) {
        wouldPlay = false;
      }
      if (this.player && this.player.currentTime) {
        this.player.setCurrentTime(time);
        if (wouldPlay) {
          this.play();
        }
        true;
      }
      return false;
    };

    Html5Video.prototype.play = function() {
      return this.player.play();
    };

    Html5Video.prototype.pause = function() {
      return this.player.pause();
    };

    Html5Video.prototype.isPaused = function() {
      return this.video.isInPauseState;
    };

    return Html5Video;

  })();

  Vimeo = (function() {

    function Vimeo(presentz, videoContainer, width, height) {
      this.presentz = presentz;
      this.videoContainer = videoContainer;
      this.width = width;
      this.height = height;
      this.receiveVideoInfo = __bind(this.receiveVideoInfo, this);

      this.video = new Video(["play"], ["pause"], ["finish"], this.presentz);
      this.wouldPlay = false;
      this.currentTimeInSeconds = 0.0;
      this.vimeoCallbackFunctionName = this.presentz.newElementName("callback");
      if (typeof window !== "undefined" && window !== null) {
        window[this.vimeoCallbackFunctionName] = this.receiveVideoInfo;
      }
      this.elementId = this.presentz.newElementName();
    }

    Vimeo.prototype.changeVideo = function(videoData, wouldPlay) {
      var ajaxCall;
      this.videoData = videoData;
      this.wouldPlay = wouldPlay;
      ajaxCall = {
        url: "http://vimeo.com/api/v2/video/" + (this.videoId(this.videoData)) + ".json",
        dataType: "jsonp",
        jsonpCallback: this.vimeoCallbackFunctionName
      };
      jQuery.ajax(ajaxCall);
    };

    Vimeo.prototype.videoId = function(videoData) {
      var id;
      id = videoData.url;
      id = id.substr(id.lastIndexOf("/") + 1);
      if (id.indexOf("?") !== -1) {
        id = id.substr(0, id.indexOf("?"));
      }
      return id;
    };

    Vimeo.prototype.receiveVideoInfo = function(data) {
      var iframe, movieUrl, onReady, videoHtml,
        _this = this;
      movieUrl = "http://player.vimeo.com/video/" + (this.videoId(this.videoData)) + "?api=1&player_id=" + this.elementId;
      if (jQuery("#" + this.elementId).length === 0) {
        videoHtml = "<iframe id=\"" + this.elementId + "\" src=\"" + movieUrl + "\" width=\"" + this.width + "\" height=\"" + this.height + "\" frameborder=\"0\"></iframe>";
        jQuery(this.videoContainer).append(videoHtml);
        iframe = jQuery("#" + this.elementId)[0];
        onReady = function(id) {
          _this.onReady(id);
        };
        $f(iframe).addEvent("ready", onReady);
      } else {
        iframe = jQuery("#" + this.elementId)[0];
        iframe.src = movieUrl;
      }
    };

    Vimeo.prototype.handle = function(video) {
      return video.url.toLowerCase().indexOf("//vimeo.com/") !== -1;
    };

    Vimeo.prototype.onReady = function(id) {
      var _this = this;
      this.player = $f(id);
      this.player.addEvent("play", function() {
        _this.video.handleEvent("play");
      });
      this.player.addEvent("pause", function() {
        _this.video.handleEvent("pause");
      });
      this.player.addEvent("finish", function() {
        _this.video.handleEvent("finish");
      });
      this.player.addEvent("playProgress", function(data) {
        _this.currentTimeInSeconds = data.seconds;
      });
      this.player.addEvent("loadProgress", function(data) {
        _this.loadedTimeInSeconds = parseInt(parseFloat(data.duration) * parseFloat(data.percent));
      });
      if (this.wouldPlay) {
        this.wouldPlay = false;
        this.play();
      }
    };

    Vimeo.prototype.currentTime = function() {
      return this.currentTimeInSeconds;
    };

    Vimeo.prototype.skipTo = function(time, wouldPlay) {
      if (wouldPlay == null) {
        wouldPlay = false;
      }
      if (time <= this.loadedTimeInSeconds) {
        this.player.api("seekTo", time);
        if (wouldPlay) {
          this.play();
        }
        true;
      }
      return false;
    };

    Vimeo.prototype.play = function() {
      return this.player.api("play");
    };

    Vimeo.prototype.pause = function() {
      return this.player.api("pause");
    };

    Vimeo.prototype.isPaused = function() {
      return this.video.isInPauseState;
    };

    return Vimeo;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  if (!(root.presentz != null)) {
    root.presentz = {};
  }

  root.presentz.Vimeo = Vimeo;

  Youtube = (function() {

    function Youtube(presentz, videoContainer, width, height) {
      this.presentz = presentz;
      this.videoContainer = videoContainer;
      this.width = width;
      this.height = height;
      this.handleEvent = __bind(this.handleEvent, this);

      this.onReady = __bind(this.onReady, this);

      this.video = new Video([1], [-1, 2], [0], this.presentz);
      this.elementId = this.presentz.newElementName();
    }

    Youtube.prototype.changeVideo = function(videoData, wouldPlay) {
      this.wouldPlay = wouldPlay;
      if (jQuery("#" + this.elementId).length === 0) {
        jQuery(this.videoContainer).append("<div id=\"" + this.elementId + "\"></div>");
        this.player = new YT.Player(this.elementId, {
          height: this.height,
          width: this.width,
          videoId: this.videoId(videoData),
          playerVars: {
            rel: 0,
            wmode: "opaque"
          },
          events: {
            onReady: this.onReady,
            onStateChange: this.handleEvent
          }
        });
      } else {
        this.player.cueVideoById(this.videoId(videoData));
      }
    };

    Youtube.prototype.videoId = function(videoData) {
      var id, lowercaseUrl;
      lowercaseUrl = videoData.url.toLowerCase();
      id = videoData.url;
      if (lowercaseUrl.indexOf("//youtu.be/") !== -1) {
        id = id.substr(id.lastIndexOf("/") + 1);
        if (id.indexOf("?") !== -1) {
          id = id.substr(0, id.indexOf("?"));
        }
      } else if (lowercaseUrl.indexOf("//youtube.com/") !== -1 || lowercaseUrl.indexOf("//www.youtube.com/") !== -1) {
        id = id.substr(id.indexOf("v=") + 2);
        if (id.indexOf("&") !== -1) {
          id = id.substr(0, id.indexOf("&"));
        }
      }
      return id;
    };

    Youtube.prototype.onReady = function() {
      if (this.wouldPlay) {
        return this.play();
      }
    };

    Youtube.prototype.handleEvent = function(event) {
      this.video.handleEvent(event.data);
    };

    Youtube.prototype.handle = function(video) {
      var lowerCaseUrl;
      lowerCaseUrl = video.url.toLowerCase();
      return lowerCaseUrl.indexOf("//youtu.be/") !== -1 || lowerCaseUrl.indexOf("//youtube.com/") !== -1 || lowerCaseUrl.indexOf("//www.youtube.com/") !== -1;
    };

    Youtube.prototype.currentTime = function() {
      if (this.player.getCurrentTime != null) {
        return this.player.getCurrentTime();
      }
      return 0;
    };

    Youtube.prototype.skipTo = function(time, wouldPlay) {
      if (wouldPlay == null) {
        wouldPlay = false;
      }
      if (this.player && this.player.seekTo) {
        if (wouldPlay || this.isPaused()) {
          this.player.seekTo(time, true);
        }
        if (wouldPlay) {
          this.play();
        }
        true;
      }
      return false;
    };

    Youtube.prototype.play = function() {
      return this.player.playVideo();
    };

    Youtube.prototype.pause = function() {
      return this.player.pauseVideo();
    };

    Youtube.prototype.isPaused = function() {
      return this.video.isInPauseState;
    };

    return Youtube;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  if (!(root.presentz != null)) {
    root.presentz = {};
  }

  root.presentz.Youtube = Youtube;

  BlipTv = (function() {

    function BlipTv(presentz, videoContainer, width, height) {
      this.presentz = presentz;
      this.video = new Html5Video(this.presentz, videoContainer, width, height);
    }

    BlipTv.prototype.changeVideo = function(videoData, wouldPlay) {
      var ajaxCall;
      this.wouldPlay = wouldPlay;
      ajaxCall = {
        url: videoData.url,
        dataType: "jsonp",
        data: "skin=json",
        jsonpCallback: "presentz.videoPlugin.receiveVideoInfo"
      };
      jQuery.ajax(ajaxCall);
    };

    BlipTv.prototype.receiveVideoInfo = function(data) {
      var fakeVideoData;
      fakeVideoData = {
        url: data[0].Post.media.url
      };
      this.video.changeVideo(fakeVideoData, this.wouldPlay);
      this.player = this.video.player;
      this.skipTo = this.video.skipTo;
    };

    BlipTv.prototype.handle = function(video) {
      return video.url.toLowerCase().indexOf("http://blip.tv") !== -1;
    };

    BlipTv.prototype.currentTime = function() {
      return this.video.currentTime();
    };

    BlipTv.prototype.skipTo = function(time, wouldPlay) {
      if (wouldPlay == null) {
        wouldPlay = false;
      }
      return this.video.skipTo(time, wouldPlay);
    };

    BlipTv.prototype.play = function() {
      return this.video.play();
    };

    BlipTv.prototype.pause = function() {
      return this.video.pause();
    };

    return BlipTv;

  })();

  ImgSlide = (function() {

    function ImgSlide(presentz, slideContainer) {
      this.presentz = presentz;
      this.slideContainer = slideContainer;
      this.preloadedSlides = [];
    }

    ImgSlide.prototype.handle = function(slide) {
      return true;
    };

    ImgSlide.prototype.changeSlide = function(slide) {
      var $slideContainer;
      if (jQuery("" + this.slideContainer + " img").length === 0) {
        $slideContainer = jQuery(this.slideContainer);
        $slideContainer.empty();
        $slideContainer.append("<img src=\"" + slide.url + "\"/>");
      } else {
        jQuery("" + this.slideContainer + " img").attr("src", slide.url);
      }
    };

    ImgSlide.prototype.preload = function(slide) {
      var image, _ref;
      if ((_ref = slide.url, __indexOf.call(this.preloadedSlides, _ref) >= 0)) {
        return;
      }
      image = new Image();
      image.src = slide.url;
    };

    return ImgSlide;

  })();

  SlideShare = (function() {

    function SlideShare(presentz, slideContainer, width, height) {
      this.presentz = presentz;
      this.slideContainer = slideContainer;
      this.width = width;
      this.height = height;
      this.currentSlide = 0;
      this.elementId = this.presentz.newElementName();
      this.swfId = this.presentz.newElementName();
    }

    SlideShare.prototype.handle = function(slide) {
      return slide.url.toLowerCase().indexOf("slideshare.net") !== -1;
    };

    SlideShare.prototype.slideId = function(slide) {
      return slide.url.substr(slide.url.lastIndexOf("/") + 1, slide.url.lastIndexOf("#") - 1 - slide.url.lastIndexOf("/"));
    };

    SlideShare.prototype.slideNumber = function(slide) {
      return parseInt(slide.url.substr(slide.url.lastIndexOf("#") + 1));
    };

    SlideShare.prototype.changeSlide = function(slide) {
      var atts, currentSlide, docId, flashvars, nextSlide, params, player;
      if (jQuery("#" + this.swfId).length === 0) {
        jQuery(this.slideContainer).append("<div id=\"" + this.elementId + "\"></div>");
        docId = this.slideId(slide);
        params = {
          allowScriptAccess: "always",
          wmode: "opaque"
        };
        atts = {
          id: this.swfId
        };
        flashvars = {
          doc: docId,
          rel: 0
        };
        swfobject.embedSWF("http://static.slidesharecdn.com/swf/ssplayer2.swf", this.elementId, this.width, this.height, "8", null, flashvars, params, atts);
        this.currentSlide = 0;
      } else {
        player = jQuery("#" + this.swfId)[0];
        nextSlide = this.slideNumber(slide);
        if (player.getCurrentSlide != null) {
          currentSlide = player.getCurrentSlide();
          if (nextSlide === (currentSlide + 1)) {
            player.next();
          } else {
            player.jumpTo(this.slideNumber(slide));
            this.currentSlide = player.getCurrentSlide();
          }
        }
      }
    };

    return SlideShare;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  if (!(root.presentz != null)) {
    root.presentz = {};
  }

  root.presentz.SlideShare = SlideShare;

  SwfSlide = (function() {

    function SwfSlide(presentz, slideContainer, width, height) {
      this.presentz = presentz;
      this.slideContainer = slideContainer;
      this.width = width;
      this.height = height;
      this.preloadedSlides = [];
      this.elementId = this.presentz.newElementName();
      this.swfId = this.presentz.newElementName();
      this.preloadSlideContainerId = this.presentz.newElementName();
      this.preloadSlideId = this.presentz.newElementName();
    }

    SwfSlide.prototype.handle = function(slide) {
      return slide.url.toLowerCase().indexOf(".swf") !== -1;
    };

    SwfSlide.prototype.changeSlide = function(slide) {
      var atts, params, swfslide;
      if (jQuery("#" + this.swfId).length === 0) {
        jQuery(this.slideContainer).empty();
        jQuery(this.slideContainer).append("<div id=\"" + this.elementId + "\"></div>");
        params = {
          wmode: "opaque"
        };
        atts = {
          id: this.swfId
        };
        swfobject.embedSWF(slide.url, this.elementId, this.width, this.height, "8", null, null, params, atts);
      } else {
        swfslide = jQuery("#" + this.swfId)[0];
        swfslide.data = slide.url;
      }
    };

    SwfSlide.prototype.preload = function(slide) {
      var atts, _ref,
        _this = this;
      if ((_ref = slide.url, __indexOf.call(this.preloadedSlides, _ref) >= 0)) {
        return;
      }
      jQuery("#" + this.preloadSlideId).remove();
      jQuery(this.slideContainer).append("<div id=\"" + this.preloadSlideContainerId + "\"></div>");
      atts = {
        id: "" + this.preloadSlideId,
        style: "visibility: hidden; position: absolute; margin: 0 0 0 0; top: 0;"
      };
      swfobject.embedSWF(slide.url, "" + this.preloadSlideContainerId, "1", "1", "8", null, null, null, atts, function() {
        return _this.preloadedSlides.push(slide.url);
      });
    };

    return SwfSlide;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  if (!(root.presentz != null)) {
    root.presentz = {};
  }

  root.presentz.SwfSlide = SwfSlide;

  SpeakerDeck = (function() {
    var slideNumber;

    function SpeakerDeck(presentz, slideContainer, width, height) {
      this.presentz = presentz;
      this.slideContainer = slideContainer;
      this.width = width;
      this.height = height;
      this.currentSlide = 0;
      this.elementId = this.presentz.newElementName();
    }

    SpeakerDeck.prototype.handle = function(slide) {
      return slide.url.toLowerCase().indexOf("speakerdeck.com") !== -1;
    };

    SpeakerDeck.prototype.changeSlide = function(slide) {
      var nextSlide, receiveMessage, script, slideId,
        _this = this;
      if (jQuery("" + this.slideContainer + " iframe.speakerdeck-iframe").length === 0) {
        jQuery(this.slideContainer).empty();
        slideId = slide.url.substring(slide.url.lastIndexOf("/") + 1, slide.url.lastIndexOf("#"));
        receiveMessage = function(event) {
          if (event.origin.indexOf("speakerdeck.com") === -1) {
            return;
          }
          _this.speakerdeckOrigin = event.origin;
          _this.speakerdeck = event.source;
          jQuery("" + _this.slideContainer + " iframe.speakerdeck-iframe").attr("style", "");
          if (event.data[0] === "change") {
            return _this.currentSlide = event.data[1].number;
          }
        };
        window.addEventListener("message", receiveMessage, false);
        script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.src = "http://speakerdeck.com/assets/embed.js";
        script.setAttribute("class", "speakerdeck-embed");
        script.setAttribute("data-id", slideId);
        jQuery(this.slideContainer)[0].appendChild(script);
      } else {
        if (this.speakerdeck != null) {
          nextSlide = slideNumber(slide);
          this.speakerdeck.postMessage(JSON.stringify(["goToSlide", nextSlide]), this.speakerdeckOrigin);
        }
      }
    };

    slideNumber = function(slide) {
      return parseInt(slide.url.substr(slide.url.lastIndexOf("#") + 1));
    };

    return SpeakerDeck;

  })();

  Presentz = (function() {

    function Presentz(videoContainer, videoWxH, slideContainer, slideWxH) {
      var slideWxHParts, videoWxHParts;
      videoWxHParts = videoWxH.split("x");
      slideWxHParts = slideWxH.split("x");
      this.availableVideoPlugins = {
        vimeo: new Vimeo(this, videoContainer, videoWxHParts[0], videoWxHParts[1]),
        youtube: new Youtube(this, videoContainer, videoWxHParts[0], videoWxHParts[1]),
        bliptv: new BlipTv(this, videoContainer, videoWxHParts[0], videoWxHParts[1]),
        html5: new Html5Video(this, videoContainer, videoWxHParts[0], videoWxHParts[1])
      };
      this.availableSlidePlugins = {
        slideshare: new SlideShare(this, slideContainer, slideWxHParts[0], slideWxHParts[1]),
        swf: new SwfSlide(this, slideContainer, slideWxHParts[0], slideWxHParts[1]),
        speakerdeck: new SpeakerDeck(this, slideContainer, slideWxHParts[0], slideWxHParts[1]),
        image: new ImgSlide(this, slideContainer, slideWxHParts[0], slideWxHParts[1])
      };
      this.videoPlugins = [this.availableVideoPlugins.vimeo, this.availableVideoPlugins.youtube, this.availableVideoPlugins.bliptv];
      this.slidePlugins = [this.availableSlidePlugins.slideshare, this.availableSlidePlugins.swf, this.availableSlidePlugins.speakerdeck];
      this.defaultVideoPlugin = this.availableVideoPlugins.html5;
      this.defaultSlidePlugin = this.availableSlidePlugins.image;
      this.currentChapterIndex = -1;
      this.currentChapter = void 0;
      this.currentSlideIndex = -1;
      this.listeners = {
        slidechange: [],
        videochange: [],
        timechange: [],
        play: [],
        pause: [],
        finish: []
      };
      this.isSynchronized = true;
    }

    Presentz.prototype.registerVideoPlugin = function(name, plugin) {
      this.availableVideoPlugins[name] = plugin;
      this.videoPlugins.push(this.availableVideoPlugins[name]);
    };

    Presentz.prototype.registerSlidePlugin = function(name, plugin) {
      this.availableSlidePlugins[name] = plugin;
      this.slidePlugins.push(this.availableSlidePlugins[name]);
    };

    Presentz.prototype.init = function(presentation) {
      var chapter, slide, _i, _j, _len, _len1, _ref, _ref1;
      this.presentation = presentation;
      this.currentChapterIndex = -1;
      this.currentChapter = void 0;
      this.currentSlideIndex = -1;
      this.howManyChapters = this.presentation.chapters.length;
      _ref = this.presentation.chapters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        chapter = _ref[_i];
        chapter.video._plugin = this.findVideoPlugin(chapter.video);
        _ref1 = chapter.slides;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          slide = _ref1[_j];
          slide._plugin = this.findSlidePlugin(slide);
        }
      }
    };

    Presentz.prototype.on = function(eventType, callback) {
      return this.listeners[eventType].push(callback);
    };

    Presentz.prototype.changeChapter = function(chapterIndex, slideIndex, play) {
      var listener, targetChapter, targetSlide, _i, _len, _ref;
      targetChapter = this.presentation.chapters[chapterIndex];
      targetSlide = targetChapter.slides[slideIndex];
      if (chapterIndex !== this.currentChapterIndex || ((this.currentChapter != null) && this.currentChapter.video._plugin.skipTo(targetSlide.time, play))) {
        this.changeSlide(targetSlide, chapterIndex, slideIndex);
        if (chapterIndex !== this.currentChapterIndex) {
          targetChapter.video._plugin.changeVideo(targetChapter.video, play);
          targetChapter.video._plugin.skipTo(targetSlide.time, play);
          _ref = this.listeners.videochange;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            listener = _ref[_i];
            listener(this.currentChapterIndex, this.currentSlideIndex, chapterIndex, slideIndex);
          }
        }
        this.currentChapterIndex = chapterIndex;
        this.currentChapter = targetChapter;
      }
    };

    Presentz.prototype.checkSlideChange = function(currentTime) {
      var candidateSlide, listener, slide, slides, _i, _j, _len, _len1, _ref;
      slides = this.presentation.chapters[this.currentChapterIndex].slides;
      for (_i = 0, _len = slides.length; _i < _len; _i++) {
        slide = slides[_i];
        if (slide.time <= currentTime) {
          candidateSlide = slide;
        }
      }
      if ((candidateSlide != null) && this.currentSlide.url !== candidateSlide.url) {
        this.changeSlide(candidateSlide, this.currentChapterIndex, slides.indexOf(candidateSlide));
      }
      _ref = this.listeners.timechange;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        listener = _ref[_j];
        listener(currentTime);
      }
    };

    Presentz.prototype.changeSlide = function(slide, chapterIndex, slideIndex) {
      var listener, next4Slides, nextSlide, previousSlideIndex, _i, _j, _len, _len1, _ref;
      this.currentSlide = slide;
      slide._plugin.changeSlide(slide);
      previousSlideIndex = this.currentSlideIndex;
      this.currentSlideIndex = slideIndex;
      next4Slides = this.presentation.chapters[chapterIndex].slides.slice(slideIndex + 1, (slideIndex + 5) + 1 || 9e9);
      for (_i = 0, _len = next4Slides.length; _i < _len; _i++) {
        nextSlide = next4Slides[_i];
        if (nextSlide._plugin.preload != null) {
          nextSlide._plugin.preload(nextSlide);
        }
      }
      _ref = this.listeners.slidechange;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        listener = _ref[_j];
        listener(this.currentChapterIndex, previousSlideIndex, chapterIndex, slideIndex);
      }
    };

    Presentz.prototype.findVideoPlugin = function(video) {
      var plugin, plugins;
      plugins = (function() {
        var _i, _len, _ref, _results;
        _ref = this.videoPlugins;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          plugin = _ref[_i];
          if (plugin.handle(video)) {
            _results.push(plugin);
          }
        }
        return _results;
      }).call(this);
      if (plugins.length > 0) {
        return plugins[0];
      }
      return this.defaultVideoPlugin;
    };

    Presentz.prototype.findSlidePlugin = function(slide) {
      var plugin, plugins;
      plugins = (function() {
        var _i, _len, _ref, _results;
        _ref = this.slidePlugins;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          plugin = _ref[_i];
          if (plugin.handle(slide)) {
            _results.push(plugin);
          }
        }
        return _results;
      }).call(this);
      if (plugins.length > 0) {
        return plugins[0];
      }
      return this.defaultSlidePlugin;
    };

    Presentz.prototype.synchronized = function(isSynchronized) {
      this.isSynchronized = isSynchronized;
      if (this.intervalSet && !this.isSynchronized) {
        this.stopTimeChecker();
      }
      if (!this.intervalSet && this.isSynchronized && !this.isPaused()) {
        return this.startTimeChecker();
      }
    };

    Presentz.prototype.startTimeChecker = function() {
      var timeChecker,
        _this = this;
      if (!this.isSynchronized) {
        return;
      }
      clearInterval(this.interval);
      this.intervalSet = true;
      timeChecker = function() {
        _this.checkState();
      };
      this.interval = setInterval(timeChecker, 500);
    };

    Presentz.prototype.stopTimeChecker = function() {
      clearInterval(this.interval);
      this.intervalSet = false;
    };

    Presentz.prototype.checkState = function() {
      if (this.currentChapter != null) {
        this.checkSlideChange(this.currentChapter.video._plugin.currentTime());
      }
    };

    Presentz.prototype.newElementName = function(prefix) {
      if (prefix != null) {
        return "" + prefix + "_" + (Math.round(Math.random() * 1000000));
      } else {
        return "element_" + (Math.round(Math.random() * 1000000));
      }
    };

    Presentz.prototype.pause = function() {
      if (this.currentChapter != null) {
        return this.currentChapter.video._plugin.pause();
      }
    };

    Presentz.prototype.isPaused = function() {
      if (this.currentChapter != null) {
        return this.currentChapter.video._plugin.isPaused();
      }
    };

    Presentz.prototype.play = function() {
      if (this.currentChapter != null) {
        return this.currentChapter.video._plugin.play();
      }
    };

    Presentz.prototype.next = function() {
      if (this.presentation.chapters[this.currentChapterIndex].slides.length > this.currentSlideIndex + 1) {
        this.changeChapter(this.currentChapterIndex, this.currentSlideIndex + 1, true);
        return true;
      }
      if (this.presentation.chapters.length > this.currentChapterIndex + 1) {
        this.changeChapter(this.currentChapterIndex + 1, 0, true);
        return true;
      }
      return false;
    };

    Presentz.prototype.previous = function() {
      if (this.currentSlideIndex - 1 >= 0) {
        this.changeChapter(this.currentChapterIndex, this.currentSlideIndex - 1, true);
        return true;
      }
      if (this.currentChapterIndex - 1 >= 0) {
        this.changeChapter(this.currentChapterIndex - 1, this.presentation.chapters[this.currentChapterIndex - 1].slides.length - 1, true);
        return true;
      }
      return false;
    };

    return Presentz;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  if (!(root.presentz != null)) {
    root.presentz = {};
  }

  root.presentz.Presentz = Presentz;

  root.Presentz = Presentz;

}).call(this);
