<div></div>

<style>
  div {
    width: var(--size, var(--space-l));
    height: var(--size, var(--space-l));
    border-radius: 50%;
    border: calc(var(--size, var(--space-l)) / 8) solid transparent;
    border-top-color: var(--primary-fg);
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
