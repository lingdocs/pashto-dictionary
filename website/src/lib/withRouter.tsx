import { ComponentType, ReactElement } from "react";
import {
  Location,
  NavigateFunction,
  Params,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

export type RouterProps = {
  router: {
    location: Location<any>,
    navigate: NavigateFunction,
    params: Readonly<Params<string>>,
  },
}


export function withRouter<P extends object>(Component: ComponentType<P & RouterProps>): ComponentType<P> {
  function ComponentWithRouterProp(props: any): ReactElement {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    return (
      <Component
        {...props}
        router={{ location, navigate, params }}
      />
    );
  }

  return ComponentWithRouterProp;
}
