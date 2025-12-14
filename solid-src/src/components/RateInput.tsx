import { Show, type JSX } from "solid-js";
import HelpButton from "./HelpButton";

function RateInput(props: {
    onInput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>;
    oninput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>;
    name: string;
    id: string;
    help?: string;
    helpUrl?: string;
    [k: string]: any;
}) {
    return (
        <div class="flex items-center gap2">
            <input type="number" class="col" {...props} />
            <span>Kbps</span>
            <Show
                when={props.help !== undefined || props.helpUrl !== undefined}
            >
                <HelpButton title={props.help} url={props.helpUrl} />
            </Show>
        </div>
    );
}

export default RateInput;
