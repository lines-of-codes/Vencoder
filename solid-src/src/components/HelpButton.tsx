import { os } from "@neutralinojs/lib";
import BreezeIcon from "./BreezeIcon";

function HelpButton(props: { title?: string; url?: string }) {
    return (
        <button
            class="icon-button"
            onclick={() => {
                if (props.url) {
                    os.open(props.url);
                }
            }}
            title={props.title}
        >
            <BreezeIcon icon="help-about" alt="Help" />
        </button>
    );
}

export default HelpButton;
