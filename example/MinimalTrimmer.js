import React from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Easing,
  Text,
  Dimensions,
} from "react-native";
import Animated from "react-native-reanimated";

import StartingText from "./StartingText";
import TrimmerSlider from "./TrimmerSlider";
import TrimmerLengthButton from "./TrimmerLengthButton";

const { width: screenWidth } = Dimensions.get("window");

const {
  set,
  block,
  call,
  event,
  add,
  multiply,
  divide,
  sub,
  cond,
  greaterOrEq,
  lessOrEq,
  and,
  onChange,
  debug,
} = Animated;

const SHOW_SCROLL_INDICATOR = true;

const MARKER_INCREMENT = 1000;
const SPECIAL_MARKER_INCREMEMNT = 2;

const TRIMMER_WIDTH = 150;
const TRIMMER_LENGTH = 5000;
const MARKER_WIDTH = 3;
const TRACK_BORDER_RADIUS = 5;

const TRACK_BACKGROUND_COLOR = "#FFF";
const TRACK_BORDER_COLOR = "#c8dad3";
const MARKER_COLOR = "#EDEFF3";
const TINT_COLOR = "#93b5b3";
const TRACK_PROGRESS_COLOR = "#93b5b3";

round = (num) => Math.round(num).toFixed(0);

clamp = ({ num, min, max }) => (num <= min ? min : num >= max ? max : num);

formatMilliseconds = (ms) => {
  // 1- Convert to seconds:
  var seconds = ms / 1000;
  // 2- Extract hours:
  var hours = parseInt(seconds / 3600); // 3,600 seconds in 1 hour
  seconds = seconds % 3600; // seconds remaining after extracting hours
  // 3- Extract minutes:
  var minutes = parseInt(seconds / 60); // 60 seconds in 1 minute
  // 4- Keep only seconds not extracted to minutes:
  seconds = seconds % 60;

  return `${round(hours)}:${
    round(minutes) < 10 ? `0${round(minutes)}` : round(minutes)
  }:${seconds < 10 ? `0${seconds.toFixed(0)}` : seconds.toFixed(0)}`;
};

export default class Trimmer extends React.Component {
  scrollX = new Animated.Value(0);
  trackProgress = new Animated.Value(0);
  contentWidth = new Animated.Value(0);
  trimmerWidth = new Animated.Value(0);
  adjustedScrollValue = new Animated.Value(0);
  animatedText = React.createRef();
  slider = React.createRef();

  state = {
    markerMargin: 0,
    contentWidth: 0,
  };

  componentDidMount() {
    this.determineMarginLength();
    this.scrollX = new Animated.Value(0);
    this.trackProgress = new Animated.Value(0);
    this.lastStartPosition = 0;
    // this.calledScrollX = block([
    //   call([this.scrollX], (r) => console.log(r[0])),
    //   this.scrollX,
    // ]);

    // this.scrollX.addListener((value) => {
    //   console.log("this.adjustedScrollValue", value);
    // });
    // onChange(this.scrollX, (value) => {
    //   console.log("this.scrollX", value);
    // });
  }

  componentDidUpdate(prevProps) {
    if (this.props.trimmerLength !== prevProps.trimmerLength) {
      this.determineMarginLength();
    }
  }

  onScroll = (positionX) => {
    const {
      scrubbing,
      totalDuration,
      onStartValueChanged,
      trimmerLength = TRIMMER_LENGTH,
      trimmerWidth = TRIMMER_WIDTH,
    } = this.props;
    const { contentWidth } = this.state;

    if (scrubbing) {
      return;
    }
    const newStartingTime =
      (positionX / this.state.contentWidth) * totalDuration;

    const newSlidePosition = newStartingTime / (totalDuration - trimmerLength);

    this.animatedText.current.setText(formatMilliseconds(newStartingTime));
    this.slider.current.setSliderValue(newSlidePosition);

    // if (
    //   Math.abs(
    //     Math.floor(newStartingTime / 1000) -
    //       Math.floor(this.lastStartPosition / 1000)
    //   ) >= +1
    // ) {
    //   console.log("onScroll newStartingTime", newStartingTime);
    //   onStartValueChanged && onStartValueChanged(newStartingTime);
    // }

    this.lastStartPosition = newStartingTime;
  };

  determineMarginLength = () => {
    const {
      trimmerLength = TRIMMER_LENGTH,
      totalDuration,
      trimmerWidth = TRIMMER_WIDTH,
      markerIncrement = MARKER_INCREMENT,
      width,
    } = this.props;

    const markerCount = (totalDuration / markerIncrement) | 0;
    const trimmerLengthInSeconds = trimmerLength / 1000;
    const contentWidth =
      (markerCount / trimmerLengthInSeconds) * (markerIncrement / 1000) * width;

    const markerMargin =
      (contentWidth - (width - trimmerWidth)) / markerCount - MARKER_WIDTH;

    this.setState({
      markerMargin,
      contentWidth,
    });

    this.contentWidth.setValue(contentWidth);
    this.trimmerWidth.setValue(trimmerWidth);

    return markerMargin;
  };

  startTrackProgressAnimation = () => {
    //TODO Get these to work
    // const { trimmerLength } = this.props;
    // this.trackProgress.setValue(0);
    // Animated.loop(
    //   Animated.timing(this.trackProgress, {
    //     toValue: 1,
    //     duration: trimmerLength,
    //     // easing: Easing.linear,
    //     // useNativeDriver: true,
    //   })
    // ).start();
  };

  stopTrackProgressAnimation = () => {
    //TODO Get these to work
    // Animated.timing(this.trackProgress).stop();
    // this.trackProgress.setValue(0);
  };

  _renderStartingText = () => {
    return <StartingText ref={this.animatedText} />;
  };

  render() {
    const {
      totalDuration,
      trackBackgroundColor = TRACK_BACKGROUND_COLOR,
      trackBorderColor = TRACK_BORDER_COLOR,
      markerColor = MARKER_COLOR,
      tintColor = TINT_COLOR,
      trackProgressColor = TRACK_PROGRESS_COLOR,
      showScrollIndicator = SHOW_SCROLL_INDICATOR,
      trimmerWidth = TRIMMER_WIDTH,
      width,
      markerIncrement = MARKER_INCREMENT,
      onScrollBeginDrag,
      onMomentumScrollEnd,
    } = this.props;

    const { markerMargin, contentWidth } = this.state;

    const trackBackgroundStyles = [
      styles.trackBackground,
      {
        width: "100%",
        backgroundColor: trackBackgroundColor,
        borderColor: trackBorderColor,
      },
    ];

    const markerCount = (totalDuration / markerIncrement) | 0;
    const markers = new Array(markerCount).fill(0) || [];

    const trackProgressWidth = this.trackProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, TRIMMER_WIDTH - 6],
    });

    const adjustedScrollValue =
      (this.scrollX._value / (contentWidth - trimmerWidth)) *
      (contentWidth - trimmerWidth);

    const foo = cond(
      and(
        greaterOrEq(new Animated.Value(1), this.adjustedScrollValue),
        lessOrEq(
          new Animated.Value(1),
          add(this.adjustedScrollValue, this.trimmerWidth)
        )
      ),
      true,
      false
    );

    return (
      <View style={styles.root}>
        {/* <Animated.Code>
          {() =>
            block([
              set(
                this.adjustedScrollValue,
                multiply(
                  divide(
                    this.scrollX,
                    sub(this.contentWidth, this.trimmerWidth)
                  ),
                  sub(this.contentWidth, this.trimmerWidth)
                )
              ),
              //debug("adjustedScrollValue", this.adjustedScrollValue),
              debug(
                "math",
                cond(
                  and(
                    greaterOrEq(
                      new Animated.Value(1),
                      this.adjustedScrollValue
                    ),
                    lessOrEq(
                      new Animated.Value(1),
                      add(this.adjustedScrollValue, this.trimmerWidth)
                    )
                  ),
                  true,
                  false
                )
              ),
              //debug("trimmerWidth", this.trimmerWidth),
              //debug("contentWidth", this.contentWidth),
              //debug("scrollX", this.scrollX),
            ])
          }
        </Animated.Code> */}
        <View style={styles.sliderContainer}>
          <View style={{ flex: 0 }}>
            <TrimmerLengthButton
              onPress={() => {}}
              trimmerLengthOption={{
                value: 20000,
                key: "20s",
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TrimmerSlider
              ref={this.slider}
              onSliderValueChanged={this.onSliderValueChanged}
              onSlidingComplete={this.onSlidingComplete}
            />
          </View>
          <View style={{ flex: 0 }}>
            <TrimmerLengthButton
              onPress={() => {}}
              trimmerLengthOption={{
                value: 20000,
                key: "20s",
              }}
            />
          </View>
        </View>
        <View>{this._renderStartingText()}</View>
        <View style={[styles.trimmerRoot, { width }]}>
          <Animated.ScrollView
            ref={(ref) => (this.scrollViewRef = ref)}
            // scrollEnabled={true}
            style={[
              styles.horizontalScrollView,
              { transform: [{ scaleX: 1.0 }] },
            ]}
            horizontal
            onScrollBeginDrag={onScrollBeginDrag}
            onMomentumScrollEnd={onMomentumScrollEnd}
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: {
                      x: (x) =>
                        Animated.block([
                          Animated.set(this.scrollX, x),
                          Animated.call([x], ([X]) => {
                            this.onScroll(X);
                          }),
                        ]),
                    },
                  },
                },
              ],
              {
                useNativeDriver: true,
              }
            )}
            scrollEventThrottle={1}
            bounces={false}
            showsHorizontalScrollIndicator={showScrollIndicator}
          >
            <View style={trackBackgroundStyles}>
              <View
                style={[
                  styles.markersContainer,
                  { paddingHorizontal: (width - trimmerWidth) / 2 },
                ]}
              >
                {markers.map((m, i) => {
                  /* const position =
                    (MARKER_WIDTH + markerMargin) * i + MARKER_WIDTH; */

                  /* 
                  const style = cond(
                    and(
                      greaterOrEq(
                        new Animated.Value(position),
                        this.adjustedScrollValue
                      ),
                      lessOrEq(
                        new Animated.Value(position),
                        add(this.adjustedScrollValue, this.trimmerWidth)
                      )
                    ),
                    [
                      styles.marker,
                      i % SPECIAL_MARKER_INCREMEMNT ? {} : styles.specialMarker,
                      {
                        backgroundColor: markerColor,
                        marginRight: markerMargin,
                      },
                      {
                        backgroundColor: tintColor,
                        transform: [{ scaleY: 1.5 }],
                      },
                    ],
                    [
                      styles.marker,
                      i % SPECIAL_MARKER_INCREMEMNT ? {} : styles.specialMarker,
                      {
                        backgroundColor: markerColor,
                        marginRight: markerMargin,
                      },
                      { backgroundColor: markerColor },
                    ]
                  );

                  if (i === 0) {
                    console.log("style:", style);
                  } */

                  return (
                    <Animated.View
                      key={`marker-${i}`}
                      // style={style}
                      style={[
                        styles.marker,
                        i % SPECIAL_MARKER_INCREMEMNT
                          ? {}
                          : styles.specialMarker,
                        {
                          marginRight: markerMargin,
                          backgroundColor: markerColor,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </Animated.ScrollView>
          <View style={styles.opacityOverlay} pointerEvents="none">
            <View
              style={[
                styles.overlay,
                { backgroundColor: trackBackgroundColor },
              ]}
            />
            <View
              style={[
                styles.overlay,
                { right: 0, backgroundColor: trackBackgroundColor },
              ]}
            />
          </View>
          <View style={styles.trimmerContainer} pointerEvents="none">
            <View
              style={[
                styles.trimmer,
                { width: TRIMMER_WIDTH },
                { borderColor: tintColor },
              ]}
            >
              <Animated.View
                style={[
                  styles.selection,
                  {
                    backgroundColor: trackProgressColor,
                    width: trackProgressWidth,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  sliderContainer: {
    // width: screenWidth,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  trimmerRoot: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  horizontalScrollView: {
    zIndex: 1,
    height: 80,
    // overflow: 'hidden',
    position: "relative",
  },
  trackBackground: {
    overflow: "hidden",
    marginVertical: 20,
    backgroundColor: TRACK_BACKGROUND_COLOR,
    height: 45,
  },
  trimmerContainer: {
    width: 200,
    height: "100%",
    paddingVertical: 15,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderColor: "red",
    borderWidth: 1,
  },
  trimmer: {
    borderColor: TINT_COLOR,
    borderWidth: 3,
    borderRadius: TRACK_BORDER_RADIUS,
  },
  selection: {
    opacity: 0.5,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: TRACK_BORDER_RADIUS - 3,
    borderBottomLeftRadius: TRACK_BORDER_RADIUS - 3,
    backgroundColor: TRACK_PROGRESS_COLOR,
    width: 0,
    height: "100%",
  },
  markersContainer: {
    flexDirection: "row",
    height: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marker: {
    backgroundColor: MARKER_COLOR, // marker color,
    width: MARKER_WIDTH,
    height: 6,
    borderRadius: 3,
  },
  specialMarker: {
    height: 12,
  },
  opacityOverlay: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 9,
    borderColor: "green",
    borderWidth: 1,
  },
  overlay: {
    position: "absolute",
    width: (screenWidth - 24 - TRIMMER_WIDTH) / 2,
    opacity: 0.8,
    height: "100%",
  },
});
