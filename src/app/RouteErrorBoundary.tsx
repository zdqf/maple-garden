import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type RouteErrorBoundaryProps = Readonly<{
  children: ReactNode;
  onRetry?: () => void;
}>;

type RouteErrorBoundaryState = Readonly<{
  hasError: boolean;
}>;

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  public override state: RouteErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  private readonly handleRetry = (): void => {
    if (this.props.onRetry !== undefined) {
      this.props.onRetry();
      this.setState({ hasError: false });
      return;
    }

    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section aria-labelledby="route-error-title" role="alert">
          <h1 id="route-error-title">页面暂时无法显示</h1>
          <p>页面资源加载失败。你可以重新加载，或返回首页继续浏览。</p>
          <div>
            <button type="button" onClick={this.handleRetry}>
              重新加载
            </button>
            <Link to="/">返回首页</Link>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
