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
