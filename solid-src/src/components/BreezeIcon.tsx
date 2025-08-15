export default function BreezeIcon(props: { icon: string; alt: string }) {
    return <i class={`b b-${props.icon}`} role="img" aria-label={props.alt} />;
}
