/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import ApiProvider, { useApi, withApis } from './ApiProvider';
import ApiRef from './ApiRef';
import ApiRegistry from './ApiRegistry';
import { render } from '@testing-library/react';
import { withLogCollector } from '@backstage/test-utils-core';

describe('ApiProvider', () => {
  type Api = () => string;
  const apiRef = new ApiRef<Api>({ id: 'x', description: '' });
  const registry = ApiRegistry.from([[apiRef, () => 'hello']]);

  const MyHookConsumer = () => {
    const api = useApi(apiRef);
    return <p>hook message: {api()}</p>;
  };

  const MyHocConsumer = withApis({ getMessage: apiRef })(({ getMessage }) => {
    return <p>hoc message: {getMessage()}</p>;
  });

  it('should provide apis', () => {
    const renderedHook = render(
      <ApiProvider apis={registry}>
        <MyHookConsumer />
      </ApiProvider>,
    );
    renderedHook.getByText('hook message: hello');

    const renderedHoc = render(
      <ApiProvider apis={registry}>
        <MyHocConsumer />
      </ApiProvider>,
    );
    renderedHoc.getByText('hoc message: hello');
  });

  it('should ignore deps in prototype', () => {
    // 100% coverage + happy typescript = hasOwnProperty + this atrocity
    const xRef = new ApiRef<number>({ id: 'x', description: '' });

    const proto = { x: xRef };
    const props = { getMessage: { enumerable: true, value: apiRef } };
    const obj = Object.create(proto, props) as {
      getMessage: typeof apiRef;
      x: typeof xRef;
    };

    const MyWeirdHocConsumer = withApis(obj)(({ getMessage }) => {
      return <p>hoc message: {getMessage()}</p>;
    });

    const renderedHoc = render(
      <ApiProvider apis={registry}>
        <MyWeirdHocConsumer />
      </ApiProvider>,
    );
    renderedHoc.getByText('hoc message: hello');
  });

  it('should error if no provider is available', () => {
    expect(
      withLogCollector(['error'], () => {
        expect(() => {
          render(<MyHookConsumer />);
        }).toThrow('No ApiProvider available in react context');
      }).error,
    ).toEqual([
      expect.stringMatching(
        /^Error: Uncaught \[Error: No ApiProvider available in react context\]/,
      ),
      expect.stringMatching(
        /^The above error occurred in the <MyHookConsumer> component/,
      ),
    ]);

    expect(
      withLogCollector(['error'], () => {
        expect(() => {
          render(<MyHocConsumer />);
        }).toThrow('No ApiProvider available in react context');
      }).error,
    ).toEqual([
      expect.stringMatching(
        /^Error: Uncaught \[Error: No ApiProvider available in react context\]/,
      ),
      expect.stringMatching(
        /^The above error occurred in the <withApis\(Component\)> component/,
      ),
    ]);
  });

  it('should error if api is not available', () => {
    expect(
      withLogCollector(['error'], () => {
        expect(() => {
          render(
            <ApiProvider apis={ApiRegistry.from([])}>
              <MyHookConsumer />
            </ApiProvider>,
          );
        }).toThrow('No implementation available for apiRef{x}');
      }).error,
    ).toEqual([
      expect.stringMatching(
        /^Error: Uncaught \[Error: No implementation available for apiRef{x}\]/,
      ),
      expect.stringMatching(
        /^The above error occurred in the <MyHookConsumer> component/,
      ),
    ]);

    expect(
      withLogCollector(['error'], () => {
        expect(() => {
          render(
            <ApiProvider apis={ApiRegistry.from([])}>
              <MyHocConsumer />
            </ApiProvider>,
          );
        }).toThrow('No implementation available for apiRef{x}');
      }).error,
    ).toEqual([
      expect.stringMatching(
        /^Error: Uncaught \[Error: No implementation available for apiRef{x}\]/,
      ),
      expect.stringMatching(
        /^The above error occurred in the <withApis\(Component\)> component/,
      ),
    ]);
  });
});
