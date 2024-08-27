<div></div>

<style>
  div {
    width: var(--size, 1.5rem);
    height: var(--size, 1.5rem);
    border-radius: 50%;
    border: calc(var(--size, 1.5rem) / 8) solid transparent;
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
