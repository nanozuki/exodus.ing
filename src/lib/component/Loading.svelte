<!--
  @component
  Render a CSS-animated spinner without component props or application I/O. The --size custom property controls
  width/height and defaults to --spacing-l.
-->
<div></div>

<style>
  div {
    width: var(--size, var(--spacing-l));
    height: var(--size, var(--spacing-l));
    border-radius: 50%;
    border: calc(var(--size, var(--spacing-l)) / 8) solid transparent;
    border-top-color: var(--color-warn);
    animation: spin 1s ease infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @-webkit-keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
