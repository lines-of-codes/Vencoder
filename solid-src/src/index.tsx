/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App.tsx";
import "./css/index.css";
import "./css/Kirigami.css";
import Neutralino from "@neutralinojs/lib";
import { clamp } from "./util/math.ts";
import convert, { type RGB } from "color-convert";
import { Route, Router } from "@solidjs/router";
import Settings from "./pages/Settings.tsx";
import ProgressPage from "./pages/ProgressPage.tsx";

const root = document.getElementById("root");

Neutralino.init();

if (window.NL_OS === "Linux") {
    let accentColorResult = await Neutralino.os.execCommand(
        `busctl --user call org.freedesktop.portal.Desktop /org/freedesktop/portal/desktop org.freedesktop.portal.Settings ReadOne ss "org.freedesktop.appearance" "accent-color"`,
    );

    let accentColor = accentColorResult.stdOut
        .substring(8)
        .split(" ", 3)
        .map((v) => Math.round(parseFloat(v) * 255)) as RGB;

    let accentHSV = convert.rgb.hsl(accentColor);

    let lighterAccent = accentHSV;
    lighterAccent[2] = Math.round(clamp(lighterAccent[2] * 1.2, 0, 100));

    document.documentElement.style.setProperty(
        "--system-accent-color",
        `rgb(${accentColor[0]}, ${accentColor[1]}, ${accentColor[2]})`,
    );

    document.documentElement.style.setProperty(
        "--system-lighter-accent",
        `hsl(${lighterAccent[0]} ${lighterAccent[1]} ${lighterAccent[2]})`,
    );
}

render(
    () => (
        <Router>
            <Route path="/" component={App} />
            <Route path="/settings" component={Settings} />
            <Route path="/progress" component={ProgressPage} />
        </Router>
    ),
    root!,
);
